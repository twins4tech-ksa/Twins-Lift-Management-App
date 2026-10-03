// Twins WA Integration API Service
// Connecting with https://wa.serv-1001.twins4tech.com

export interface WhatsAppConfig {
  baseUrl: string;
  apiToken: string;
  defaultCountryCode: string;
  source: string;
  enabled: boolean;
}

const STORAGE_KEY_WA = 'twins_wa_settings_v1';

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  baseUrl: 'https://wa.serv-1001.twins4tech.com',
  apiToken: 'fbe8674783dea0f0bf95073e4365853fd6181c4345c5b3fd',
  defaultCountryCode: '966',
  source: 'twins-app',
  enabled: true,
};

export function getWhatsAppConfig(): WhatsAppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WA);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure the official active credentials are maintained if storage had old placeholder
      return { 
        ...DEFAULT_WHATSAPP_CONFIG, 
        ...parsed, 
        baseUrl: parsed.baseUrl || DEFAULT_WHATSAPP_CONFIG.baseUrl,
        apiToken: parsed.apiToken || DEFAULT_WHATSAPP_CONFIG.apiToken,
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_WHATSAPP_CONFIG;
}

export function saveWhatsAppConfig(config: Partial<WhatsAppConfig>): WhatsAppConfig {
  const current = getWhatsAppConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_KEY_WA, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save WhatsApp config:', err);
  }
  return updated;
}

/**
 * Format phone number to international WhatsApp standard:
 * - strips non-digit characters
 * - replaces leading 0 with country code (e.g. 0501234567 -> 966501234567)
 * - handles numbers starting with + or 00
 */
export function formatWhatsAppNumber(phone: string, defaultCountryCode = '966'): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }
  if (cleaned.startsWith('0')) {
    cleaned = defaultCountryCode + cleaned.slice(1);
  }
  if (!cleaned.startsWith(defaultCountryCode) && cleaned.length === 9 && cleaned.startsWith('5')) {
    cleaned = defaultCountryCode + cleaned;
  }
  return cleaned;
}

export function generateWaMeUrl(phone: string, message?: string): string {
  const formatted = formatWhatsAppNumber(phone);
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${formatted}${textParam}`;
}

export interface SendWhatsAppPayload {
  mobile_no: string;
  message: string;
  priority?: 'critical' | 'high' | 'normal';
  source?: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  message?: string;
  outbox_id?: string;
  error?: string;
  fallbackUrl?: string;
  raw?: any;
}

/**
 * Sends a WhatsApp message using the Twins WA Integration API.
 * Automatically tries the local dev proxy first (/api/wa-proxy/api/webhooks/send)
 * and falls back to direct Base URL if proxy is unavailable.
 */
export async function sendWhatsAppMessage(payload: SendWhatsAppPayload): Promise<SendWhatsAppResult> {
  const config = getWhatsAppConfig();
  const formattedNumber = formatWhatsAppNumber(payload.mobile_no, config.defaultCountryCode);
  const fallbackUrl = generateWaMeUrl(formattedNumber, payload.message);

  if (!formattedNumber || formattedNumber.length < 8) {
    return {
      success: false,
      error: 'رقم الهاتف غير صالح للإرسال (يجب أن يحتوي على 8 إلى 15 رقماً)',
      fallbackUrl,
    };
  }

  const bodyData = {
    mobile_no: formattedNumber,
    message: payload.message,
    priority: payload.priority || 'normal',
    source: payload.source || config.source || 'twins-app',
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-webhook-token': config.apiToken,
    'Authorization': `Bearer ${config.apiToken}`,
  };

  // Try endpoints in order: local proxy first (to avoid CORS), then direct URL
  const endpoints = [
    '/api/wa-proxy/api/webhooks/send',
    `${config.baseUrl.replace(/\/+$/, '')}/api/webhooks/send`,
  ];

  let lastError: string | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyData),
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      if (response.ok && (data.success || data.status === 'queued' || data.outbox_id)) {
        return {
          success: true,
          message: data.message || 'تم إرسال الرسالة بنجاح عبر API الواتساب الخاص بالنظام (Twins WA API)',
          outbox_id: data.outbox_id,
          raw: data,
          fallbackUrl,
        };
      } else {
        lastError = data.error || data.message || `HTTP ${response.status}: فشل الإرسال`;
        // If not a 404 from proxy, break and return the real API error
        if (response.status !== 404) {
          break;
        }
      }
    } catch (err: any) {
      lastError = err?.message || 'تعذر الاتصال بخادم الواتساب';
    }
  }

  return {
    success: false,
    error: lastError || 'فشل الاتصال بخدمة واتساب',
    fallbackUrl,
  };
}

/**
 * Checks connectivity to the Twins WhatsApp Integration service.
 */
export async function checkWhatsAppConnection(): Promise<{ connected: boolean; statusText: string; raw?: any }> {
  const config = getWhatsAppConfig();
  const headers = {
    'x-webhook-token': config.apiToken,
    'Authorization': `Bearer ${config.apiToken}`,
  };

  const endpoints = [
    '/api/wa-proxy/api/webhooks/status',
    `${config.baseUrl.replace(/\/+$/, '')}/api/webhooks/status`,
    '/api/wa-proxy/health',
    `${config.baseUrl.replace(/\/+$/, '')}/health`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, { headers });
      if (res.ok) {
        const data = await res.json();
        return {
          connected: true,
          statusText: data.status || 'متصل وجاهز للعمل ✅',
          raw: data,
        };
      }
    } catch {
      // try next
    }
  }

  return {
    connected: false,
    statusText: 'غير متصل حالياً أو تعذر الوصول إلى الخادم',
  };
}

// -------------------------------------------------------------
// Ready-to-use Notification Message Builders
// -------------------------------------------------------------

export function buildVisitScheduledMessage({
  customerName,
  elevatorName,
  scheduledDate,
  siteLocation,
  technicianName,
  technicianPhone,
  companyName = 'شركة توينز للمصاعد',
}: {
  customerName: string;
  elevatorName: string;
  scheduledDate: string;
  siteLocation?: string;
  technicianName?: string;
  technicianPhone?: string;
  companyName?: string;
}): string {
  let msg = `عزيزنا العميل: *${customerName}* 🏢\n\n`;
  msg += `نحيطكم علماً بأنه تم جدولة زيارة الصيانة الوقائية الدورية لمصعدكم:\n`;
  msg += `▫️ *المصعد:* ${elevatorName}\n`;
  msg += `▫️ *الموعد المجدول:* ${scheduledDate}\n`;
  if (siteLocation) msg += `▫️ *الموقع:* ${siteLocation}\n`;
  if (technicianName) msg += `▫️ *الفني المسؤول:* ${technicianName}\n`;
  if (technicianPhone) msg += `▫️ *هاتف الفني:* ${technicianPhone}\n`;
  msg += `\nشاكرين تعاونكم ومؤكدين حرصنا على سلامتكم وكفاءة تشغيل مصاعدكم.\n`;
  msg += `*${companyName}* 📞`;
  return msg;
}

export function buildVisitCompletedMessage({
  customerName,
  elevatorName,
  completedDate,
  technicianName,
  elevatorCondition,
  notes,
  companyName = 'شركة توينز للمصاعد',
}: {
  customerName: string;
  elevatorName: string;
  completedDate: string;
  technicianName?: string;
  elevatorCondition?: string;
  notes?: string;
  companyName?: string;
}): string {
  let msg = `عزيزنا العميل: *${customerName}* ✅\n\n`;
  msg += `تم بحمد الله إنجاز وتوثيق زيارة الصيانة الوقائية الدورية بنجاح:\n`;
  msg += `▫️ *المصعد:* ${elevatorName}\n`;
  msg += `▫️ *تاريخ الإنجاز:* ${completedDate}\n`;
  if (technicianName) msg += `▫️ *الفني المنفذ:* ${technicianName}\n`;
  if (elevatorCondition) msg += `▫️ *الحالة الفنية للمصعد:* ${elevatorCondition}\n`;
  if (notes) msg += `▫️ *ملاحظات الفحص:* ${notes}\n`;
  msg += `\nتم فحص لوحة التحكم وحساسات الأبواب ومكابح الأمان وكافة أجزاء المصعد وفق المعايير المعتمدة.\n`;
  msg += `*${companyName}* 🛠️`;
  return msg;
}

export function buildTechnicianDispatchMessage({
  technicianName,
  customerName,
  customerPhone,
  elevatorName,
  siteLocation,
  scheduledDate,
  notes,
  isReassigned = false,
}: {
  technicianName: string;
  customerName: string;
  customerPhone?: string;
  elevatorName: string;
  siteLocation?: string;
  scheduledDate: string;
  notes?: string;
  isReassigned?: boolean;
}): string {
  let msg = `مرحباً *${technicianName}* 👷‍♂️\n\n`;
  if (isReassigned) {
    msg += `تم *تعديل وتكليفك* بمهمة زيارة صيانة دورية:\n`;
  } else {
    msg += `تم إسناد زيارة صيانة دورية جديدة لك:\n`;
  }
  msg += `▫️ *العميل:* ${customerName}\n`;
  if (customerPhone) msg += `▫️ *هاتف التواصل:* ${customerPhone}\n`;
  msg += `▫️ *المصعد:* ${elevatorName}\n`;
  if (siteLocation) msg += `▫️ *الموقع:* ${siteLocation}\n`;
  msg += `▫️ *التاريخ:* ${scheduledDate}\n`;
  if (notes) msg += `▫️ *ملاحظات وتوجيهات:* ${notes}\n`;
  msg += `\nيرجى التواصل مع العميل وتوثيق الزيارة فور الإنجاز عبر البوابة الميدانية.`;
  return msg;
}

export function buildVisitRescheduledMessage({
  customerName,
  elevatorName,
  oldDate,
  newDate,
  reason,
  technicianName,
  technicianPhone,
  companyName = 'شركة توينز للمصاعد',
}: {
  customerName: string;
  elevatorName: string;
  oldDate: string;
  newDate: string;
  reason?: string;
  technicianName?: string;
  technicianPhone?: string;
  companyName?: string;
}): string {
  let msg = `عزيزنا العميل: *${customerName}* 🗓️\n\n`;
  msg += `نحيطكم علماً بأنه تمت إعادة جدولة موعد زيارة الصيانة الوقائية لمصعدكم:\n`;
  msg += `▫️ *المصعد:* ${elevatorName}\n`;
  msg += `▫️ *الموعد السابق:* ${oldDate}\n`;
  msg += `▫️ *الموعد المعتمد الجديد:* ${newDate}\n`;
  if (reason) msg += `▫️ *سبب التعديل:* ${reason}\n`;
  if (technicianName) msg += `▫️ *الفني المسؤول:* ${technicianName}\n`;
  if (technicianPhone) msg += `▫️ *هاتف الفني:* ${technicianPhone}\n`;
  msg += `\nشاكرين حسن تفهمكم، ونسعد دائماً بخدمتكم.\n`;
  msg += `*${companyName}* 📞`;
  return msg;
}

export function buildTechnicianScheduleSummaryMessage({
  technicianName,
  monthName,
  year,
  visitsCount,
  visitsList,
  companyName = 'شركة توينز للمصاعد',
}: {
  technicianName: string;
  monthName: string;
  year: number;
  visitsCount: number;
  visitsList: Array<{ date: string; customer: string; elevator: string; location?: string }>;
  companyName?: string;
}): string {
  let msg = `مرحباً الفني المعتمد *${technicianName}* 👷‍♂️\n\n`;
  msg += `إليك جدول زيارات الصيانة الوقائية الموكلة إليك لشهر *${monthName} ${year}*:\n`;
  msg += `📊 *إجمالي الزيارات:* ${visitsCount} زيارة\n\n`;
  visitsList.slice(0, 15).forEach((v, i) => {
    msg += `${i + 1}. *${v.date}* - ${v.customer} (${v.elevator})${v.location ? ` - ${v.location}` : ''}\n`;
  });
  if (visitsList.length > 15) {
    msg += `... ومتبقي ${visitsList.length - 15} زيارة أخرى مسجلة بالنظام.\n`;
  }
  msg += `\nيرجى متابعة المواعيد والتوثيق من خلال تطبيق النظام.\n`;
  msg += `*إدارة العمليات - ${companyName}* 🏢`;
  return msg;
}

export function buildClientScheduleSummaryMessage({
  customerName,
  monthName,
  year,
  visits,
  companyName = 'شركة توينز للمصاعد',
}: {
  customerName: string;
  monthName: string;
  year: number;
  visits: Array<{ date: string; elevator: string; techName?: string; status: string }>;
  companyName?: string;
}): string {
  let msg = `عزيزنا العميل: *${customerName}* 🏢\n\n`;
  msg += `يسرنا تزويدكم بجدول مواعيد زيارات الصيانة الدورية المعتمدة لشهر *${monthName} ${year}*:\n\n`;
  visits.forEach((v, i) => {
    msg += `${i + 1}. *${v.date}* - مصعد: ${v.elevator} (${v.status})\n`;
    if (v.techName) msg += `   الفني المعين: ${v.techName}\n`;
  });
  msg += `\nفريق الصيانة حريص دائماً على خدمتكم بأعلى معايير الجودة والسلامة.\n`;
  msg += `*${companyName}* 🛠️`;
  return msg;
}

export function buildBreakdownAlertMessage({
  customerName,
  elevatorName,
  siteLocation,
  priority,
  description,
  companyName = 'شركة توينز للمصاعد',
}: {
  customerName: string;
  elevatorName: string;
  siteLocation?: string;
  priority: string;
  description: string;
  companyName?: string;
}): string {
  let msg = `عزيزنا العميل: *${customerName}* ⚠️\n\n`;
  msg += `تم استلام بلاغ العطل الطارئ لمصعدكم وجارٍ متابعته بأعلى أولوية:\n`;
  msg += `▫️ *المصعد:* ${elevatorName}\n`;
  if (siteLocation) msg += `▫️ *الموقع:* ${siteLocation}\n`;
  msg += `▫️ *درجة الأولوية:* ${priority}\n`;
  msg += `▫️ *وصف البلاغ:* ${description}\n`;
  msg += `\nفريق الطوارئ الميداني في طريقه إليكم أو بصدد التنسيق معكم فوراً.\n`;
  msg += `*${companyName} - طوارئ المصاعد* 🚨`;
  return msg;
}

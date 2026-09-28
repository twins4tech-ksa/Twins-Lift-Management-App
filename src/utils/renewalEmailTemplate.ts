import { MaintenanceContract } from '../types/maintenance';
import { CompanySettings } from '../types/settings';
import { AppLanguage } from '../utils/translations';
import { getContractExpiryInfo } from './maintenanceExpiry';

export interface RenewalEmailData {
  recipientEmail: string;
  recipientName: string;
  ccEmail: string;
  subject: string;
  body: string;
  mailtoUrl: string;
  contractRef: string;
  proposedRenewalRef: string;
  proposedStartDate: string;
  proposedEndDate: string;
  proposedPrice: number;
  daysRemaining: number;
  elevatorName: string;
  siteLocation: string;
}

/**
 * Calculates next renewal dates starting the day after current contract ends.
 */
export function getRenewalPeriod(endDateStr?: string): { startDate: string; endDate: string; renewalYear: number } {
  const today = new Date();
  let start = new Date();

  if (endDateStr) {
    const parts = endDateStr.split('-');
    if (parts.length === 3) {
      start = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      start.setDate(start.getDate() + 1);
    }
  }

  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);

  const pad = (n: number) => String(n).padStart(2, '0');
  const startDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const endDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;

  return {
    startDate,
    endDate,
    renewalYear: start.getFullYear(),
  };
}

/**
 * Generates official Renewal Quotation Email content for clients whose maintenance contracts expire in under 30 days.
 */
export function generateRenewalEmail(
  contract: MaintenanceContract,
  companySettings: CompanySettings,
  language: AppLanguage = 'ar',
  customPrice?: number
): RenewalEmailData {
  const isAr = language === 'ar';
  const expiryInfo = getContractExpiryInfo(contract, 30);
  const daysRemaining = expiryInfo?.diffDays ?? 30;

  const { startDate: proposedStartDate, endDate: proposedEndDate, renewalYear } = getRenewalPeriod(contract.endDate);
  const proposedPrice = customPrice !== undefined && customPrice > 0 ? customPrice : (contract.totalPrice || 12000);
  const proposedRenewalRef = `MNT-REN-${renewalYear}-${contract.contractRef.replace(/^[A-Z]+-([A-Z]+-)?/i, '')}`;

  const recipientEmail = contract.customerEmail || '';
  const recipientName = contract.customerName || (isAr ? 'العميل الكريم' : 'Valued Client');
  const ccEmail = companySettings.email || 'info@twins4tech.com';

  const companyNameAr = companySettings.companyNameAr || 'شركة تقنية الروافع للتجارة (HTH / توينز للمصاعد)';
  const companyNameEn = companySettings.companyNameEn || 'Twins Elevators & Escalators Co. (HTH)';
  const phone = companySettings.phone || '+966 11 000 0000';
  const email = companySettings.email || 'service@twinselevators.com';
  const website = companySettings.website || 'www.twinselevators.com';

  const visitsCount = contract.annualVisitsCount || 12;
  const emergencyCoverage = contract.emergencyCoverage !== false;
  const responseTime = contract.responseTimeHours || 2;

  let subject = '';
  let body = '';

  if (isAr) {
    subject = `إشعار بقرب انتهاء عقد الصيانة رقم (${contract.contractRef}) وعرض تجديد الخدمة - ${contract.customerName}`;

    body = `السادة / ${contract.customerCompany ? `${contract.customerCompany} - ` : ''}${recipientName} المحترمون،
تحية طيبة وبعد،،

نتقدم لكم بجزيل الشكر والتقدير لثقتكم الغالية في خدمات شركة ${companyNameAr}.

نود إحاطة عنايتكم الكريمة بأن عقد الصيانة الدوري للمصعد الموضح أدناه يوشك على الانتهاء خلال (${daysRemaining} يوماً) بتاريخ ${contract.endDate}:
─────────────────────────────────────────────────────────────
• رقم العقد الحالي: ${contract.contractRef} ${contract.elevatorNumber ? `(رمز المصعد: ${contract.elevatorNumber})` : ''}
• المصعد المشمول: ${contract.elevatorName} (${contract.elevatorBrand || 'توينز / فوجي'})
• موقع الموقع: ${contract.siteLocation}
• تاريخ نهاية العقد الحالي: ${contract.endDate} (متبقي ${daysRemaining} يوماً)
─────────────────────────────────────────────────────────────

حرصاً منا على استمرارية السلامة العامة وكفاءة التشغيل المعتمدة، وتفادياً لأي توقف مفاجئ للخدمة أو رسوم صيانة طارئة منفصلة، يسرنا أن نتقدم لكم بـ:

【 عرض تجديد عقد الصيانة السنوي الجديد - لعام ${renewalYear} 】
─────────────────────────────────────────────────────────────
• الرقم المرجعي لعرض التجديد: ${proposedRenewalRef}
• فترة السريان المقترحة: عام كامل من ${proposedStartDate} وحتى ${proposedEndDate}
• عدد الزيارات الوقائية الدورية: ${visitsCount} زيارة صيانة معتمدة (بمعدل زيارة شهرية مجدولة)
• خدمة الطوارئ السريعة: ${emergencyCoverage ? `مشمولة ومفعلة 24/7 طوال أيام السنة` : 'حسب الطلب'}
• سرعة الاستجابة لبلاغات الأعطال: خلال ${responseTime} ساعة كحد أقصى وفك الاحتجاز الفوري
• القيمة الإجمالية للتجديد: ${proposedPrice.toLocaleString()} ريال سعودي (شاملة الدعم الفني الميداني)
• طريقة الدفع: ${contract.paymentFrequency === 'Quarterly' ? 'أقساط ربع سنوية' : contract.paymentFrequency === 'Biannual' ? 'دفعتين نصف سنوية' : 'دفعة سنوية'}
─────────────────────────────────────────────────────────────

المزايا الحصرية لعملاء التجديد المستمر:
1. أولوية قصوى لفرق الطوارئ الميدانية عبر تطبيق الصيانة المباشر.
2. تتبع سجل الفحوصات الدورية رقمياً وإشعارات البلاغات الفورية.
3. خصم خاص معتمد على قطع الغيار الأصلية وتحديث المنظومة.

للاعتماد والموافقة الكريمة:
يرجى التكرم بالرد بالموافقة على هذا البريد الإلكتروني، أو التواصل مباشرة مع قسم العقود وخدمة العملاء.

وتفضلوا بقبول فائق التحية والاحترام،،

فريق إدارة عقود الصيانة والدعم الفني
${companyNameAr}
هاتف / واتساب: ${phone}
البريد الإلكتروني: ${email}
الموقع الإلكتروني: ${website}
${companySettings.commercialRegistration ? `سجل تجاري: ${companySettings.commercialRegistration}` : ''} ${companySettings.vatNumber ? `| الرقم الضريبي: ${companySettings.vatNumber}` : ''}`;
  } else {
    subject = `Maintenance Contract Expiration Notice & Renewal Quotation (${contract.contractRef}) - ${contract.customerName}`;

    body = `Dear ${contract.customerCompany ? `${contract.customerCompany} - ` : ''}${recipientName},

Greetings from ${companyNameEn}.

We would like to thank you for your ongoing partnership and trust in our elevator maintenance services.

This is an automated notification to inform you that your current maintenance contract will expire in ${daysRemaining} day(s) on ${contract.endDate}:
─────────────────────────────────────────────────────────────
• Current Contract Ref: ${contract.contractRef} ${contract.elevatorNumber ? `(Unit Code: ${contract.elevatorNumber})` : ''}
• Elevator: ${contract.elevatorName} (${contract.elevatorBrand || 'Twins / Fuji'})
• Site Location: ${contract.siteLocation}
• Current Expiry Date: ${contract.endDate} (${daysRemaining} days left)
─────────────────────────────────────────────────────────────

To guarantee continuous elevator safety, EN 81 compliance, and uninterrupted service, we are pleased to submit our:

【 Annual Maintenance Contract Renewal Proposal - Year ${renewalYear} 】
─────────────────────────────────────────────────────────────
• Renewal Quote Reference: ${proposedRenewalRef}
• Proposed Service Period: 1 Full Year (${proposedStartDate} to ${proposedEndDate})
• Scheduled Routine Visits: ${visitsCount} certified preventive maintenance visits (monthly)
• 24/7 Emergency Dispatch: ${emergencyCoverage ? 'Included 24/7/365 with rapid passenger release' : 'On demand'}
• Response Time Commitment: Within ${responseTime} hour(s) maximum
• Total Renewal Price: SAR ${proposedPrice.toLocaleString()} (Excl. VAT)
• Payment Schedule: ${contract.paymentFrequency || 'Annual'}
─────────────────────────────────────────────────────────────

Benefits for Valued Renewing Clients:
1. Priority dispatch for emergency technician callouts.
2. Real-time digital visit reports & breakdown tracking.
3. Special loyalty discounts on genuine spare parts.

To approve and activate this renewal:
Please reply to this email confirming acceptance, or contact our contracts department directly.

Best regards,

Contracts & Maintenance Department
${companyNameEn}
Phone / WhatsApp: ${phone}
Email: ${email}
Website: ${website}
${companySettings.commercialRegistration ? `CR: ${companySettings.commercialRegistration}` : ''} ${companySettings.vatNumber ? `| VAT: ${companySettings.vatNumber}` : ''}`;
  }

  // Generate mailto URL with properly encoded query parameters
  const mailtoParams = new URLSearchParams();
  if (ccEmail) mailtoParams.append('cc', ccEmail);
  mailtoParams.append('subject', subject);
  mailtoParams.append('body', body);

  const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?${mailtoParams.toString()}`;

  return {
    recipientEmail,
    recipientName,
    ccEmail,
    subject,
    body,
    mailtoUrl,
    contractRef: contract.contractRef,
    proposedRenewalRef,
    proposedStartDate,
    proposedEndDate,
    proposedPrice,
    daysRemaining,
    elevatorName: contract.elevatorName,
    siteLocation: contract.siteLocation,
  };
}

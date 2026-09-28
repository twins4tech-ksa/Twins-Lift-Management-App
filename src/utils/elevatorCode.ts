/**
 * Twins Lift Manager - نظام توليد وترميز أرقام المصاعد
 * يعتمد كود المصعد على نوع العملية وتاريخ الإصدار (السنة والشهر):
 * - في حالة التركيب (INSTALLATION): كود بنمط INS-YYYYMM-XXX
 * - في حالة عقد صيانة مسجل جديد (MAINTENANCE): كود بنمط MNT-YYYYMM-XXX
 */

export type ElevatorCodeType = 'INSTALLATION' | 'MAINTENANCE';

/**
 * توليد كود ورقم المصعد تلقائياً
 * @param type نوع العملية ('INSTALLATION' أو 'MAINTENANCE')
 * @param dateInput تاريخ الإصدار أو الإنشاء (سلسلة نصية أو كائن Date)
 * @param sequence رقم التسلسل (افتراضي 1)
 */
export function generateElevatorNumber(
  type: ElevatorCodeType,
  dateInput?: string | Date,
  sequence: number = 1
): string {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (typeof dateInput === 'string') {
    // If only YYYY-MM or YYYY-MM-DD
    const cleaned = dateInput.trim();
    d = new Date(cleaned.length === 7 ? `${cleaned}-01` : cleaned);
    if (isNaN(d.getTime())) d = new Date();
  } else {
    d = dateInput;
  }

  const year = d.getFullYear() || new Date().getFullYear();
  const month = String((d.getMonth() + 1) || (new Date().getMonth() + 1)).padStart(2, '0');
  const seqStr = String(Math.max(1, sequence)).padStart(3, '0');
  const prefix = type === 'INSTALLATION' ? 'INS' : 'MNT';

  return `${prefix}-${year}${month}-${seqStr}`;
}

/**
 * التحقق من صيغة رقم المصعد
 */
export function validateElevatorNumber(code: string): { isValid: boolean; type?: ElevatorCodeType; year?: string; month?: string } {
  if (!code) return { isValid: false };
  const match = code.trim().match(/^(INS|MNT)-(\d{4})(\d{2})-\d+$/i);
  if (!match) return { isValid: false };
  return {
    isValid: true,
    type: match[1].toUpperCase() === 'INS' ? 'INSTALLATION' : 'MAINTENANCE',
    year: match[2],
    month: match[3],
  };
}

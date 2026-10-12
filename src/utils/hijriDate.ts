/**
 * Utility functions for Islamic / Hijri calendar formatting (Umm al-Qura)
 * and dual Gregorian-Hijri calendar representations for executive dashboards.
 */

export function formatHijriDate(date: Date = new Date(), isAr: boolean = true): string {
  try {
    if (isAr) {
      // Saudi Umm al-Qura calendar with standard numerals: e.g. "30 ربيع الآخر 1448 هـ"
      const formatted = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
      return formatted.includes('هـ') ? formatted : `${formatted} هـ`;
    } else {
      // e.g. "Rab. II 30, 1448 AH"
      return new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }
  } catch {
    return isAr ? '١٤٤٨ هـ' : '1448 AH';
  }
}

export function formatGregorianDate(date: Date = new Date(), isAr: boolean = true): string {
  try {
    if (isAr) {
      return date.toLocaleDateString('ar-SA-u-nu-latn', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  } catch {
    return date.toDateString();
  }
}

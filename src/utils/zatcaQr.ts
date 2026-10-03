import QRCode from 'qrcode';

/**
 * Encodes a single TLV (Tag-Length-Value) field according to ZATCA guidelines
 */
function toTLV(tag: number, value: string): Uint8Array {
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(value);
  const length = valueBytes.length;
  
  const tlv = new Uint8Array(2 + length);
  tlv[0] = tag;
  tlv[1] = length;
  tlv.set(valueBytes, 2);
  
  return tlv;
}

/**
 * Generates ZATCA Base64 TLV string for Phase 1 & Phase 2 QR codes
 * 
 * Tag 1: Seller Name
 * Tag 2: VAT Registration Number
 * Tag 3: Timestamp (ISO 8601)
 * Tag 4: Invoice Total (with VAT)
 * Tag 5: VAT Amount
 */
export function generateZatcaTlvBase64(params: {
  sellerName: string;
  vatRegistrationNumber: string;
  timestamp: string; // ISO 8601 e.g. "2026-10-01T15:30:00Z"
  invoiceTotalWithVat: number | string;
  vatAmount: number | string;
}): string {
  const sellerNameTLV = toTLV(1, params.sellerName || 'شركة توينز للمصاعد المحدودة');
  const vatNumberTLV = toTLV(2, String(params.vatRegistrationNumber || '300000000000003'));
  const timestampTLV = toTLV(3, params.timestamp || new Date().toISOString());
  const totalTLV = toTLV(4, Number(params.invoiceTotalWithVat || 0).toFixed(2));
  const vatTLV = toTLV(5, Number(params.vatAmount || 0).toFixed(2));

  const totalLength = 
    sellerNameTLV.length + 
    vatNumberTLV.length + 
    timestampTLV.length + 
    totalTLV.length + 
    vatTLV.length;

  const combined = new Uint8Array(totalLength);
  let offset = 0;

  for (const tlv of [sellerNameTLV, vatNumberTLV, timestampTLV, totalTLV, vatTLV]) {
    combined.set(tlv, offset);
    offset += tlv.length;
  }

  // Convert Uint8Array to binary string for btoa
  let binary = '';
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }

  return btoa(binary);
}

/**
 * Generates QR Code Data URL directly for rendering in React <img> or Canvas
 */
export async function generateZatcaQrDataUrl(params: {
  sellerName: string;
  vatRegistrationNumber: string;
  timestamp: string;
  invoiceTotalWithVat: number | string;
  vatAmount: number | string;
}): Promise<string> {
  try {
    const tlvBase64 = generateZatcaTlvBase64(params);
    return await QRCode.toDataURL(tlvBase64, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 220,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate ZATCA QR code:', err);
    // Fallback QR with plain text if TLV fails
    return await QRCode.toDataURL(
      `ZATCA:${params.sellerName}|VAT:${params.vatRegistrationNumber}|TOTAL:${params.invoiceTotalWithVat}`,
      { margin: 1, width: 220 }
    );
  }
}

import QRCode from 'qrcode';
import { ElevatorSpecification } from '../types/elevator';

export interface ProjectQRConfig {
  docScope?: string;
  baseUrl?: string;
  size?: number;
  margin?: number;
  primaryColor?: string;
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Builds the canonical digital access URL for an elevator quotation or contract.
 * Allows quick lookup and instant loading of the digital project record.
 */
export function buildProjectDigitalUrl(
  spec: ElevatorSpecification,
  docScope: string = 'UNIFIED_MASTER',
  baseUrl?: string
): string {
  let origin = baseUrl;
  if (!origin && typeof window !== 'undefined') {
    origin = `${window.location.origin}${window.location.pathname}`;
  }
  const cleanOrigin = (origin || '').replace(/\/$/, '');

  const params = new URLSearchParams();
  if (spec.id) {
    params.set('project', spec.id);
  }
  const refCode = spec.quoteRef || spec.id;
  if (refCode) {
    params.set('ref', refCode);
  }
  if (docScope) {
    params.set('doc', docScope.toLowerCase());
  }
  if (spec.clientName) {
    params.set('client', spec.clientName.trim());
  }
  if (spec.projectName) {
    params.set('pname', spec.projectName.trim());
  }
  params.set('v', 'digital-v1');

  return `${cleanOrigin}?${params.toString()}`;
}

/**
 * Generates a PNG Data URL of the QR code encoding the project reference and URL.
 */
export async function generateProjectQRDataUrl(
  spec: ElevatorSpecification,
  config: ProjectQRConfig = {}
): Promise<string> {
  const targetUrl = buildProjectDigitalUrl(spec, config.docScope, config.baseUrl);
  return generateCustomQRDataUrl(targetUrl, config);
}

/**
 * Generates an SVG string of the QR code encoding the project reference and URL.
 */
export async function generateProjectQRSvg(
  spec: ElevatorSpecification,
  config: ProjectQRConfig = {}
): Promise<string> {
  const targetUrl = buildProjectDigitalUrl(spec, config.docScope, config.baseUrl);
  try {
    const svg = await QRCode.toString(targetUrl, {
      type: 'svg',
      width: config.size || 200,
      margin: config.margin ?? 1,
      color: {
        dark: config.darkColor || config.primaryColor || '#0f172a',
        light: config.lightColor || '#ffffff',
      },
      errorCorrectionLevel: config.errorCorrectionLevel || 'M',
    });
    return svg;
  } catch (err) {
    console.error('[QR] Failed to generate project QR SVG:', err);
    return '';
  }
}

/**
 * Universal utility to generate a QR Code Data URL for any arbitrary string or URL.
 */
export async function generateCustomQRDataUrl(
  content: string,
  config: ProjectQRConfig = {}
): Promise<string> {
  if (!content) return '';
  try {
    const dataUrl = await QRCode.toDataURL(content, {
      width: config.size || 240,
      margin: config.margin ?? 1,
      color: {
        dark: config.darkColor || config.primaryColor || '#0f172a',
        light: config.lightColor || '#ffffff',
      },
      errorCorrectionLevel: config.errorCorrectionLevel || 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('[QR] Failed to generate custom QR Data URL:', err);
    return '';
  }
}

/**
 * Helper to parse URL query parameters for loaded project ref and doc view.
 */
export function parseProjectUrlParams(searchString?: string): {
  projectId: string | null;
  ref: string | null;
  doc: string | null;
  client: string | null;
} {
  const search = searchString ?? (typeof window !== 'undefined' ? window.location.search : '');
  const params = new URLSearchParams(search);
  return {
    projectId: params.get('project'),
    ref: params.get('ref') || params.get('quoteRef'),
    doc: params.get('doc'),
    client: params.get('client'),
  };
}

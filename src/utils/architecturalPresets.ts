import { ElevatorSpecification, WallFinish, FloorFinish, CeilingStyle, ElevatorType } from '../types/elevator';

export type ArchitecturalRenderType = 'CABIN_INTERIOR' | 'SHAFT_SECTION' | 'PANORAMIC_GLASS' | 'ENTRANCE_DOOR';

export interface ArchitecturalPreset {
  id: string;
  type: ArchitecturalRenderType;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  defaultPrompt: string;
  svgDataUri: string;
}

export function generateElevatorArchitecturalPrompt(
  spec: Partial<ElevatorSpecification>,
  renderType: ArchitecturalRenderType = 'CABIN_INTERIOR'
): string {
  const elevType = spec.elevatorType || 'MRL_TRACTION';
  const wallFinish = spec.wallFinish || 'BRUSHED_STEEL_304';
  const floorFinish = spec.floorFinish || 'GRANITE_BLACK_GALAXY';
  const ceilingStyle = spec.ceilingStyle || 'LED_DOWNLIGHTS_CUTOUT';
  const cw = spec.cabinWidthMm || 1100;
  const cd = spec.cabinDepthMm || 1400;
  const ch = spec.cabinHeightMm || 2300;
  const capacity = spec.capacityKg || 630;
  const persons = spec.personsCount || 8;

  let wallDesc = 'brushed 304 stainless steel wall panels with satin hairline texture';
  if (wallFinish === 'MIRROR_ETCHED_GOLD') {
    wallDesc = 'luxury titanium mirror etched gold stainless steel panels with subtle geometric arabesque patterns and central bronze mirror';
  } else if (wallFinish === 'HAIRLINE_TITANIUM_BLACK') {
    wallDesc = 'premium hairline titanium black stainless steel panels with concealed warm ambient vertical cove lighting';
  } else if (wallFinish === 'PANORAMIC_GLASS') {
    wallDesc = 'crystal-clear laminated tempered safety glass panoramic walls with seamless stainless steel structural point-fixings';
  } else if (wallFinish === 'WOOD_VENEER_LUXURY') {
    wallDesc = 'rich natural walnut architectural wood veneer panels with brushed champagne gold metal inlays';
  }

  let floorDesc = 'polished Nero Marquina black galaxy granite floor with subtle golden flecks';
  if (floorFinish === 'PVC_MARBLE_EFFECT') {
    floorDesc = 'high-gloss Calacatta white marble floor tiles with grey and gold veining';
  } else if (floorFinish === 'CERAMIC_TILES') {
    floorDesc = 'matte Italian porcelain ceramic tiles with non-slip architectural finish';
  } else if (floorFinish === 'CHECKERED_STEEL_PLATE') {
    floorDesc = 'industrial embossed anti-slip stainless steel checkered checker-plate floor';
  }

  let ceilingDesc = 'suspended ceiling with flush recessed warm 3000K LED downlights and indirect perimeter halo illumination';
  if (ceilingStyle === 'INDIRECT_HALO_ACRYLIC') {
    ceilingDesc = 'frosted opal acrylic luminous ceiling with smooth uniform diffused warm-white LED backlighting';
  } else if (ceilingStyle === 'STAINLESS_MIRROR_SPOT') {
    ceilingDesc = 'mirror-finish polished stainless steel false ceiling with miniature starry spot LED downlights';
  }

  switch (renderType) {
    case 'SHAFT_SECTION':
      return `Photorealistic 3D architectural cutaway section of an elevator hoistway shaft, dimension ${spec.shaftWidthMm || 1600}mm width by ${spec.shaftDepthMm || 1800}mm depth, reinforced concrete shaft walls with steel guide rails, counterweight frame, traveling cables, buffer springs in pit, overhead machine beam, clean architectural engineering visualization, octane render, 8k resolution, architectural cross-section, professional construction proposal style.`;

    case 'PANORAMIC_GLASS':
      return `Photorealistic 3D architectural rendering of a modern panoramic glass elevator cabin (${capacity}kg, ${persons} persons capacity) ascending through a sun-drenched luxury commercial atrium with skylight, transparent glass walls, polished stainless steel car sling, elegant interior illumination, modern architectural background, wide angle, photorealistic, 8k resolution, architectural photography.`;

    case 'ENTRANCE_DOOR':
      return `Photorealistic interior architectural rendering of a luxury elevator landing entrance, automatic center-opening doors in ${wallDesc}, wide architectural portal architrave, illuminated digital call button station with directional indicator, polished floor reflection, warm hotel lobby lighting, interior design rendering, 8k resolution, architectural photography.`;

    case 'CABIN_INTERIOR':
    default:
      return `Photorealistic 3D architectural interior rendering of a luxury passenger elevator cabin, dimensions ${cw}mm width by ${cd}mm depth by ${ch}mm height. Walls: ${wallDesc}. Flooring: ${floorDesc}. Ceiling: ${ceilingDesc}. Features a full-height glass touch car operating panel (COP) with floor numbers, horizontal ergonomic handrail, warm architectural interior lighting, photorealistic interior design, 8k resolution, high-end commercial building quotation style.`;
  }
}

// Helper to convert SVG string to clean Data URI
function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

export const ARCHITECTURAL_PRESETS: ArchitecturalPreset[] = [
  {
    id: 'preset-cabin-gold-mirror',
    type: 'CABIN_INTERIOR',
    titleAr: 'كابينة استانلس ستيل ذهبي منقوش (Luxury Gold Mirror)',
    titleEn: 'Luxury Mirror Etched Gold Cabin Interior',
    descriptionAr: 'تصور ثلاثي الأبعاد فاخر من الستانلس ستيل الذهبي الميرور مع أرضية جرانيت جلاكسي وإنارة سبوت سقفية دافئة.',
    descriptionEn: 'High-end titanium gold mirror etched stainless steel with galaxy granite floor & ambient LED ceiling.',
    defaultPrompt: 'Photorealistic 3D architectural interior of luxury elevator cabin, titanium mirror etched gold panels, galaxy black granite floor, warm LED ceiling downlights, sleek handrail and touch screen COP panel, 8k render.',
    svgDataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1a140b"/>
            <stop offset="100%" stop-color="#0b0805"/>
          </linearGradient>
          <linearGradient id="ceilingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#3d2c12"/>
            <stop offset="100%" stop-color="#241a0b"/>
          </linearGradient>
          <linearGradient id="goldWallL" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#4a3615"/>
            <stop offset="50%" stop-color="#b8860b"/>
            <stop offset="100%" stop-color="#6e4f16"/>
          </linearGradient>
          <linearGradient id="goldWallR" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6e4f16"/>
            <stop offset="50%" stop-color="#d4af37"/>
            <stop offset="100%" stop-color="#4a3615"/>
          </linearGradient>
          <linearGradient id="goldBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#8c6218"/>
            <stop offset="40%" stop-color="#d4af37"/>
            <stop offset="70%" stop-color="#aa7c11"/>
            <stop offset="100%" stop-color="#4a3615"/>
          </linearGradient>
          <linearGradient id="mirrorCenter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff8e7" stop-opacity="0.9"/>
            <stop offset="30%" stop-color="#ecd599" stop-opacity="0.6"/>
            <stop offset="70%" stop-color="#d4af37" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#2a1d08" stop-opacity="0.8"/>
          </linearGradient>
          <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1a1d20"/>
            <stop offset="50%" stop-color="#0d0e10"/>
            <stop offset="100%" stop-color="#050506"/>
          </linearGradient>
          <radialGradient id="lightHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fff3d1" stop-opacity="1"/>
            <stop offset="60%" stop-color="#e8c36b" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#aa7c11" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <!-- Background -->
        <rect width="800" height="600" fill="url(#bgGrad)"/>
        <!-- Ceiling Polygon (Perspective) -->
        <polygon points="120,60 680,60 560,160 240,160" fill="url(#ceilingGrad)"/>
        <!-- Floor Polygon (Perspective) -->
        <polygon points="240,460 560,460 680,560 120,560" fill="url(#floorGrad)"/>
        <!-- Floor Reflection Grid -->
        <polygon points="280,470 520,470 580,540 220,540" fill="#d4af37" opacity="0.08"/>
        <!-- Back Wall -->
        <polygon points="240,160 560,160 560,460 240,460" fill="url(#goldBack)"/>
        <!-- Center Gold Mirror Panel -->
        <rect x="330" y="180" width="140" height="260" rx="4" fill="url(#mirrorCenter)" stroke="#fae092" stroke-width="2"/>
        <line x1="335" y1="185" x2="400" y2="435" stroke="#ffffff" stroke-width="2" stroke-opacity="0.4"/>
        <!-- Left Wall -->
        <polygon points="120,60 240,160 240,460 120,560" fill="url(#goldWallL)"/>
        <!-- Left Wall Vertical Stripes -->
        <polygon points="150,85 180,110 180,510 150,535" fill="#f5d77f" opacity="0.15"/>
        <polygon points="190,118 220,143 220,477 190,502" fill="#f5d77f" opacity="0.12"/>
        <!-- Right Wall -->
        <polygon points="680,60 560,160 560,460 680,560" fill="url(#goldWallR)"/>
        <!-- Right Wall COP Panel -->
        <polygon points="590,200 620,180 620,440 590,445" fill="#111" stroke="#ecd599" stroke-width="1.5"/>
        <circle cx="605" cy="230" r="8" fill="#d4af37"/>
        <rect x="600" y="260" width="10" height="120" rx="2" fill="#222"/>
        <!-- Ceiling Lights -->
        <ellipse cx="320" cy="110" rx="35" ry="12" fill="url(#lightHalo)"/>
        <ellipse cx="480" cy="110" rx="35" ry="12" fill="url(#lightHalo)"/>
        <ellipse cx="400" cy="125" rx="45" ry="14" fill="url(#lightHalo)"/>
        <!-- Handrail across back wall -->
        <rect x="250" y="340" width="300" height="8" rx="4" fill="#fae092" stroke="#8a6112" stroke-width="1"/>
        <circle cx="270" cy="344" r="5" fill="#d4af37"/>
        <circle cx="530" cy="344" r="5" fill="#d4af37"/>
        <!-- Architectural Overlay Branding -->
        <rect x="20" y="20" width="220" height="34" rx="6" fill="#000000" fill-opacity="0.75" stroke="#d4af37" stroke-width="1"/>
        <text x="35" y="42" fill="#ecd599" font-family="sans-serif" font-size="12" font-weight="bold">ARCHITECTURAL 3D RENDER</text>
        <!-- Bottom Banner with specs -->
        <rect x="20" y="540" width="760" height="40" rx="6" fill="#000000" fill-opacity="0.8" stroke="#333" stroke-width="1"/>
        <text x="40" y="565" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">MIRROR ETCHED GOLD CABIN &bull; EN 81-20</text>
        <text x="760" y="565" text-anchor="end" fill="#d4af37" font-family="sans-serif" font-size="12">TWINS ELEVATORS ARCHITECTURAL SPECIFICATION</text>
      </svg>
    `)
  },
  {
    id: 'preset-cabin-hairline-titanium',
    type: 'CABIN_INTERIOR',
    titleAr: 'كابينة استانلس تيتانيوم أسود فاخر (Titanium Black)',
    titleEn: 'Titanium Black Satin Stainless Steel Cabin',
    descriptionAr: 'تصميم فندقي حديث من الإستانلس ستيل الأسود التيتانيوم مع خطوط إضاءة عمودية مخفية وأرضية رخامية بيضاء.',
    descriptionEn: 'Modern executive titanium black hairline stainless steel with recessed vertical LED coves & white marble.',
    defaultPrompt: 'Photorealistic architectural 3D rendering of luxury modern elevator cabin, titanium black hairline stainless steel walls, recessed warm vertical LED cove lighting, white Calacatta marble floor, touchscreen operating panel.',
    svgDataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <linearGradient id="darkBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#14171a"/>
            <stop offset="100%" stop-color="#0a0c0e"/>
          </linearGradient>
          <linearGradient id="blackWallL" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#181c20"/>
            <stop offset="50%" stop-color="#2a3038"/>
            <stop offset="100%" stop-color="#1c2026"/>
          </linearGradient>
          <linearGradient id="blackWallR" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#1c2026"/>
            <stop offset="50%" stop-color="#2a3038"/>
            <stop offset="100%" stop-color="#181c20"/>
          </linearGradient>
          <linearGradient id="backBlack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#222830"/>
            <stop offset="60%" stop-color="#181d24"/>
            <stop offset="100%" stop-color="#101317"/>
          </linearGradient>
          <linearGradient id="coveLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffe8b8" stop-opacity="1"/>
            <stop offset="50%" stop-color="#ffbf69" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#ffe8b8" stop-opacity="0.3"/>
          </linearGradient>
          <linearGradient id="whiteMarble" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f5f7fa"/>
            <stop offset="50%" stop-color="#e4e8ee"/>
            <stop offset="100%" stop-color="#cdd3dc"/>
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#darkBg)"/>
        <!-- Ceiling -->
        <polygon points="120,60 680,60 560,160 240,160" fill="#1b1f24"/>
        <!-- Floor (White Calacatta Marble) -->
        <polygon points="240,460 560,460 680,560 120,560" fill="url(#whiteMarble)"/>
        <!-- Marble Veins -->
        <path d="M 280,480 Q 400,520 540,490" stroke="#8c97a8" stroke-width="2" fill="none" opacity="0.35"/>
        <path d="M 220,540 Q 380,510 600,550" stroke="#717d8e" stroke-width="2" fill="none" opacity="0.3"/>
        <!-- Back Wall -->
        <polygon points="240,160 560,160 560,460 240,460" fill="url(#backBlack)"/>
        <!-- Recessed Vertical Cove Lights on Back Wall -->
        <rect x="290" y="170" width="6" height="280" fill="url(#coveLight)"/>
        <rect x="504" y="170" width="6" height="280" fill="url(#coveLight)"/>
        <!-- Center Charcoal Accent Panel -->
        <rect x="330" y="175" width="140" height="270" rx="3" fill="#14181f" stroke="#363f4d" stroke-width="1.5"/>
        <!-- Left Wall -->
        <polygon points="120,60 240,160 240,460 120,560" fill="url(#blackWallL)"/>
        <polygon points="170,102 180,110 180,510 170,518" fill="url(#coveLight)" opacity="0.7"/>
        <!-- Right Wall -->
        <polygon points="680,60 560,160 560,460 680,560" fill="url(#blackWallR)"/>
        <polygon points="620,110 630,102 630,518 620,510" fill="url(#coveLight)" opacity="0.7"/>
        <!-- Modern Slim Handrail -->
        <rect x="250" y="350" width="300" height="6" rx="3" fill="#3a4454" stroke="#5d6d84" stroke-width="1"/>
        <!-- Ceiling Spotlights -->
        <ellipse cx="320" cy="110" rx="20" ry="8" fill="#ffeec9" opacity="0.8"/>
        <ellipse cx="480" cy="110" rx="20" ry="8" fill="#ffeec9" opacity="0.8"/>
        <ellipse cx="400" cy="110" rx="20" ry="8" fill="#ffeec9" opacity="0.8"/>
        <!-- Branding Overlays -->
        <rect x="20" y="20" width="240" height="34" rx="6" fill="#000000" fill-opacity="0.8" stroke="#4a5568" stroke-width="1"/>
        <text x="35" y="42" fill="#cbd5e1" font-family="sans-serif" font-size="12" font-weight="bold">TITANIUM BLACK &bull; CONCEPT</text>
        <rect x="20" y="540" width="760" height="40" rx="6" fill="#000000" fill-opacity="0.85" stroke="#333" stroke-width="1"/>
        <text x="40" y="565" fill="#f1f5f9" font-family="sans-serif" font-size="13" font-weight="bold">EXECUTIVE TITANIUM BLACK CABIN &bull; CALACATTA MARBLE</text>
        <text x="760" y="565" text-anchor="end" fill="#94a3b8" font-family="sans-serif" font-size="12">TWINS ARCHITECTURAL CAD SUITE</text>
      </svg>
    `)
  },
  {
    id: 'preset-cabin-panoramic-glass',
    type: 'PANORAMIC_GLASS',
    titleAr: 'مصعد بانوراما زجاجي كامل 360° (Full Panoramic Glass)',
    titleEn: 'Panoramic Frameless Glass Elevator Atrium View',
    descriptionAr: 'مصعد زجاجي بانورامي مفتوح على بهو المبنى أو الفيلا مع إطلالة ساطعة وهيكل ستانلس ستيل مصقول.',
    descriptionEn: 'Full 360 panoramic glass elevator overlooking building atrium with skylight and stainless steel frame.',
    defaultPrompt: 'Photorealistic 3D architectural rendering of luxury panoramic glass elevator car moving through a sunlit commercial atrium, transparent glass walls, polished stainless steel car sling, floor-to-ceiling glass, architectural photography.',
    svgDataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <linearGradient id="atriumBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#e0f2fe"/>
            <stop offset="40%" stop-color="#bae6fd"/>
            <stop offset="80%" stop-color="#cbd5e1"/>
            <stop offset="100%" stop-color="#94a3b8"/>
          </linearGradient>
          <linearGradient id="glassTint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3"/>
            <stop offset="50%" stop-color="#ffffff" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="#0284c7" stop-opacity="0.25"/>
          </linearGradient>
          <linearGradient id="steelRing" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#94a3b8"/>
            <stop offset="50%" stop-color="#f8fafc"/>
            <stop offset="100%" stop-color="#64748b"/>
          </linearGradient>
        </defs>
        <!-- Atrium Background -->
        <rect width="800" height="600" fill="url(#atriumBg)"/>
        <!-- Background Architectural Pillars & Windows -->
        <line x1="80" y1="0" x2="80" y2="600" stroke="#94a3b8" stroke-width="16" opacity="0.4"/>
        <line x1="720" y1="0" x2="720" y2="600" stroke="#94a3b8" stroke-width="16" opacity="0.4"/>
        <line x1="0" y1="180" x2="800" y2="180" stroke="#64748b" stroke-width="3" opacity="0.3"/>
        <line x1="0" y1="360" x2="800" y2="360" stroke="#64748b" stroke-width="3" opacity="0.3"/>
        <!-- Guide Rails in Background -->
        <rect x="220" y="0" width="12" height="600" fill="#475569"/>
        <rect x="568" y="0" width="12" height="600" fill="#475569"/>
        <!-- Cabin Ceiling Ring (Curved Panoramic) -->
        <path d="M 240,140 C 240,80 560,80 560,140 Z" fill="url(#steelRing)" stroke="#334155" stroke-width="2"/>
        <ellipse cx="400" cy="140" rx="160" ry="25" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
        <!-- Panoramic Glass Body -->
        <rect x="240" y="140" width="320" height="320" rx="10" fill="url(#glassTint)" stroke="#38bdf8" stroke-width="2"/>
        <!-- Glass Highlights & Specular Reflections -->
        <path d="M 260,160 L 320,440" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.6"/>
        <path d="M 280,160 L 335,440" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
        <path d="M 520,160 L 480,440" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
        <!-- Circular Glass Handrail Inside -->
        <path d="M 260,330 C 320,360 480,360 540,330" fill="none" stroke="#f8fafc" stroke-width="8" opacity="0.9"/>
        <!-- Cabin Floor Base (Curved Steel & Stone) -->
        <ellipse cx="400" cy="460" rx="160" ry="25" fill="#334155" stroke="#0f172a" stroke-width="2"/>
        <path d="M 240,460 C 240,510 560,510 560,460 Z" fill="url(#steelRing)" stroke="#1e293b" stroke-width="2"/>
        <!-- Subtle Interior Lighting Glow -->
        <ellipse cx="400" cy="145" rx="80" ry="12" fill="#ffffff" opacity="0.8"/>
        <!-- Overlay Badges -->
        <rect x="20" y="20" width="260" height="34" rx="6" fill="#0f172a" fill-opacity="0.8" stroke="#38bdf8" stroke-width="1"/>
        <text x="35" y="42" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="bold">PANORAMIC GLASS 360&deg;</text>
        <rect x="20" y="540" width="760" height="40" rx="6" fill="#0f172a" fill-opacity="0.85" stroke="#334155" stroke-width="1"/>
        <text x="40" y="565" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">PANORAMIC GLASS ELEVATOR &bull; ATRIUM ARCHITECTURAL INTEGRATION</text>
        <text x="760" y="565" text-anchor="end" fill="#38bdf8" font-family="sans-serif" font-size="12">TWINS ARCHITECTURAL CAD SUITE</text>
      </svg>
    `)
  },
  {
    id: 'preset-shaft-cutaway-section',
    type: 'SHAFT_SECTION',
    titleAr: 'مقطع رأسي معماري لبئر المصعد (Shaft Hoistway Cutaway)',
    titleEn: 'Shaft Hoistway Architectural 3D Cutaway Section',
    descriptionAr: 'مقطع منظوري هندسي ثلاثي الأبعاد لجدران البئر الخرسانية والسكك وثقل الموازنة وغرفة التحليق والحفرة.',
    descriptionEn: 'Engineering 3D cutaway visualization of the reinforced concrete shaft, guide rails, counterweight & pit.',
    defaultPrompt: 'Architectural 3D cutaway illustration of elevator hoistway shaft, reinforced concrete walls, steel guide rails, counterweight frame, buffer springs in pit, traveling cables, CAD engineering visualization, 8k render.',
    svgDataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <linearGradient id="shaftBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <linearGradient id="concreteWall" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#64748b"/>
            <stop offset="50%" stop-color="#94a3b8"/>
            <stop offset="100%" stop-color="#475569"/>
          </linearGradient>
          <linearGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3b82f6"/>
            <stop offset="100%" stop-color="#1d4ed8"/>
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#shaftBg)"/>
        <!-- Shaft Concrete Walls Cutaway -->
        <rect x="180" y="40" width="30" height="520" fill="url(#concreteWall)"/>
        <rect x="590" y="40" width="30" height="520" fill="url(#concreteWall)"/>
        <rect x="180" y="40" width="440" height="25" fill="url(#concreteWall)"/>
        <rect x="180" y="535" width="440" height="25" fill="url(#concreteWall)"/>
        <!-- Dimension Annotation Markers -->
        <line x1="140" y1="40" x2="140" y2="560" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4,4"/>
        <text x="130" y="300" fill="#38bdf8" font-family="monospace" font-size="12" text-anchor="end" transform="rotate(-90 130 300)">TOTAL TRAVEL + OH + PIT</text>
        <line x1="210" y1="20" x2="590" y2="20" stroke="#38bdf8" stroke-width="2"/>
        <text x="400" y="15" fill="#38bdf8" font-family="monospace" font-size="11" text-anchor="middle">SHAFT WIDTH (SW)</text>
        <!-- Steel Guide Rails -->
        <line x1="240" y1="65" x2="240" y2="535" stroke="#f1f5f9" stroke-width="6"/>
        <line x1="560" y1="65" x2="560" y2="535" stroke="#f1f5f9" stroke-width="6"/>
        <!-- Overhead Machine Support Beams -->
        <rect x="220" y="70" width="360" height="18" fill="#e2e8f0" stroke="#475569"/>
        <circle cx="400" cy="80" r="16" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
        <!-- Pit Buffer Springs -->
        <rect x="290" y="500" width="24" height="35" rx="3" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
        <rect x="486" y="500" width="24" height="35" rx="3" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
        <rect x="388" y="505" width="24" height="30" rx="3" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
        <!-- Counterweight Frame (Rear Left) -->
        <rect x="255" y="160" width="50" height="180" rx="2" fill="#334155" stroke="#94a3b8" stroke-width="1.5"/>
        <line x1="255" y1="200" x2="305" y2="200" stroke="#64748b"/>
        <line x1="255" y1="240" x2="305" y2="240" stroke="#64748b"/>
        <line x1="255" y1="280" x2="305" y2="280" stroke="#64748b"/>
        <!-- Elevator Cabin Assembly (Center) -->
        <rect x="330" y="240" width="210" height="230" rx="4" fill="url(#carBody)" stroke="#93c5fd" stroke-width="2"/>
        <!-- Cabin Glass / Door Opening -->
        <rect x="360" y="270" width="150" height="190" rx="2" fill="#dbeafe" opacity="0.8" stroke="#60a5fa"/>
        <!-- Cabin Sling (Crosshead & Uprights) -->
        <rect x="315" y="235" width="240" height="10" fill="#f8fafc" stroke="#334155"/>
        <rect x="315" y="465" width="240" height="10" fill="#f8fafc" stroke="#334155"/>
        <rect x="315" y="245" width="10" height="220" fill="#f8fafc"/>
        <rect x="545" y="245" width="10" height="220" fill="#f8fafc"/>
        <!-- Suspension Steel Wire Ropes -->
        <line x1="400" y1="80" x2="435" y2="235" stroke="#cbd5e1" stroke-width="3"/>
        <line x1="400" y1="80" x2="280" y2="160" stroke="#cbd5e1" stroke-width="3"/>
        <!-- Header & Footers -->
        <rect x="20" y="20" width="260" height="34" rx="6" fill="#000000" fill-opacity="0.8" stroke="#38bdf8" stroke-width="1"/>
        <text x="35" y="42" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="bold">HOISTWAY SECTION CUTAWAY</text>
        <rect x="20" y="540" width="760" height="40" rx="6" fill="#000000" fill-opacity="0.85" stroke="#334155" stroke-width="1"/>
        <text x="40" y="565" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">ARCHITECTURAL HOISTWAY CUTAWAY &bull; SBC 801 / EN 81-20</text>
        <text x="760" y="565" text-anchor="end" fill="#38bdf8" font-family="sans-serif" font-size="12">TWINS ARCHITECTURAL CAD SUITE</text>
      </svg>
    `)
  },
  {
    id: 'preset-landing-entrance-doors',
    type: 'ENTRANCE_DOOR',
    titleAr: 'مدخل وباب المصعد الخارجي (Landing Door Portal)',
    titleEn: 'Luxury Landing Entrance Architrave & Landing Doors',
    descriptionAr: 'واجهة مدخل المصعد في الطابق مع إطار رخامي عريض وشاشة استدعاء حديثة وأبواب أوتوماتيكية.',
    descriptionEn: 'Architectural landing door entrance with wide portal architrave, hall lantern & digital call station.',
    defaultPrompt: 'Photorealistic architectural interior rendering of luxury elevator landing entrance, automatic brushed stainless steel sliding doors, wide marble portal architrave, illuminated hall lantern display, warm lobby lighting.',
    svgDataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
        <defs>
          <linearGradient id="lobbyWall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1e2229"/>
            <stop offset="100%" stop-color="#0f1115"/>
          </linearGradient>
          <linearGradient id="marblePortal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4a3b2c"/>
            <stop offset="40%" stop-color="#8c7355"/>
            <stop offset="70%" stop-color="#c4a47c"/>
            <stop offset="100%" stop-color="#3d2f21"/>
          </linearGradient>
          <linearGradient id="doorSteel" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#4b5563"/>
            <stop offset="50%" stop-color="#d1d5db"/>
            <stop offset="100%" stop-color="#374151"/>
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#lobbyWall)"/>
        <!-- Polished Lobby Floor -->
        <polygon points="0,480 800,480 800,600 0,600" fill="#111317"/>
        <line x1="0" y1="480" x2="800" y2="480" stroke="#374151" stroke-width="2"/>
        <!-- Wide Marble Portal Architrave -->
        <rect x="220" y="80" width="360" height="400" rx="4" fill="url(#marblePortal)" stroke="#d4af37" stroke-width="1.5"/>
        <!-- Marble Veins -->
        <path d="M 230,100 Q 300,160 250,240" stroke="#fae092" stroke-width="1.5" fill="none" opacity="0.4"/>
        <path d="M 550,120 Q 520,220 570,320" stroke="#fae092" stroke-width="1.5" fill="none" opacity="0.4"/>
        <!-- Door Opening Recess -->
        <rect x="280" y="140" width="240" height="340" fill="#000000"/>
        <!-- Left Door Panel -->
        <rect x="282" y="142" width="117" height="336" fill="url(#doorSteel)" stroke="#1f2937" stroke-width="1"/>
        <line x1="390" y1="142" x2="390" y2="478" stroke="#9ca3af" stroke-width="2"/>
        <!-- Right Door Panel -->
        <rect x="401" y="142" width="117" height="336" fill="url(#doorSteel)" stroke="#1f2937" stroke-width="1"/>
        <line x1="410" y1="142" x2="410" y2="478" stroke="#9ca3af" stroke-width="2"/>
        <!-- Center Gap Seal -->
        <rect x="398" y="142" width="4" height="336" fill="#111827"/>
        <!-- Hall Lantern & Floor Display above doors -->
        <rect x="360" y="100" width="80" height="28" rx="4" fill="#0f172a" stroke="#d4af37" stroke-width="1.5"/>
        <text x="400" y="120" fill="#f59e0b" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">&uarr; G</text>
        <!-- Landing Call Button Station on Right Wall -->
        <rect x="620" y="270" width="40" height="90" rx="6" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
        <circle cx="640" cy="300" r="10" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
        <path d="M 636,303 L 640,297 L 644,303 Z" fill="#38bdf8"/>
        <circle cx="640" cy="330" r="10" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
        <path d="M 636,327 L 640,333 L 644,327 Z" fill="#94a3b8"/>
        <!-- Header & Footer Branding -->
        <rect x="20" y="20" width="260" height="34" rx="6" fill="#000000" fill-opacity="0.8" stroke="#d4af37" stroke-width="1"/>
        <text x="35" y="42" fill="#d4af37" font-family="sans-serif" font-size="12" font-weight="bold">LANDING ENTRANCE ARCHITRAVE</text>
        <rect x="20" y="540" width="760" height="40" rx="6" fill="#000000" fill-opacity="0.85" stroke="#333" stroke-width="1"/>
        <text x="40" y="565" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">LUXURY ELEVATOR LANDING PORTAL &bull; STAINLESS &amp; MARBLE</text>
        <text x="760" y="565" text-anchor="end" fill="#d4af37" font-family="sans-serif" font-size="12">TWINS ARCHITECTURAL CAD SUITE</text>
      </svg>
    `)
  }
];

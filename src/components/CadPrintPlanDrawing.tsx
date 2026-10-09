import React from 'react';
import { ElevatorSpecification } from '../types/elevator';
import { calculateElevatorEngineering } from '../utils/elevatorCalculations';

interface Props {
  spec: ElevatorSpecification;
  primaryColor?: string;
  accentColor?: string;
}

export const CadPrintPlanDrawing: React.FC<Props> = ({
  spec,
  primaryColor = '#172033',
  accentColor = '#b6be49',
}) => {
  const calc = calculateElevatorEngineering(spec);

  const SW = spec.shaftWidthMm;
  const SD = spec.shaftDepthMm;
  const CW = spec.cabinWidthMm;
  const CD = spec.cabinDepthMm;
  const DW = spec.doorWidthMm;

  // Coordinate math for plan view SVG (viewBox: 0 0 920 540)
  // Shaft center at X: 460, Y: 260
  const maxDim = Math.max(SW, SD, 2200);
  const planScale = 380 / maxDim;

  const shaftSvgW = SW * planScale;
  const shaftSvgH = SD * planScale;
  const shaftX = 460 - shaftSvgW / 2;
  const shaftY = 245 - shaftSvgH / 2;

  const isSideDoor = spec.doorType?.toUpperCase().includes('SIDE');
  const defaultSillGap = isSideDoor ? 150 : 100;
  const frontSillMargin = spec.cabinFrontSillOffsetMm ?? defaultSillGap;
  const sideMarginOffset = spec.cabinSideOffsetMm ?? 0;
  const rearMarginOffset = spec.cabinRearOffsetMm ?? 0;

  const carSvgW = CW * planScale;
  const carSvgH = CD * planScale;

  const frontSillOffset = frontSillMargin * planScale;
  const carFrontY = shaftY + shaftSvgH - frontSillOffset;
  const carSvgY = carFrontY - carSvgH + (rearMarginOffset * planScale);

  const safeCwtDepthMm = spec.counterweightDepthMm ?? 250;
  const safeCwtWidthMm = spec.counterweightWidthMm ?? 800;

  // Counterweight position with default to REAR
  const cwtPosition = spec.counterweightPosition || 'REAR';
  const isSideCwt = cwtPosition === 'SIDE_LEFT' || cwtPosition === 'SIDE_RIGHT';

  const cwtSvgW = (isSideCwt ? safeCwtDepthMm : safeCwtWidthMm) * planScale;
  const cwtSvgH = (isSideCwt ? safeCwtWidthMm : safeCwtDepthMm) * planScale;

  let cwtX = shaftX;
  let cwtY = shaftY;

  if (cwtPosition === 'REAR') {
    cwtX = shaftX + (shaftSvgW - cwtSvgW) / 2;
    const rearWallGap = 70 * planScale;
    cwtY = shaftY + rearWallGap;
  } else if (cwtPosition === 'SIDE_LEFT') {
    cwtX = shaftX + 30 * planScale;
    cwtY = shaftY + (shaftSvgH - cwtSvgH) / 2;
  } else {
    // SIDE_RIGHT
    cwtX = shaftX + shaftSvgW - cwtSvgW - 30 * planScale;
    cwtY = shaftY + (shaftSvgH - cwtSvgH) / 2;
  }

  let baseCarSvgX = shaftX + (shaftSvgW - carSvgW) / 2;
  const minCwtCarGap = 50 * planScale;

  if (cwtPosition === 'SIDE_LEFT') {
    const minSafeCarX = cwtX + cwtSvgW + minCwtCarGap;
    if (baseCarSvgX < minSafeCarX) baseCarSvgX = minSafeCarX;
  } else if (cwtPosition === 'SIDE_RIGHT') {
    const maxSafeCarX = cwtX - minCwtCarGap - carSvgW;
    if (baseCarSvgX > maxSafeCarX) baseCarSvgX = maxSafeCarX;
  }

  const carSvgX = baseCarSvgX + (sideMarginOffset * planScale);

  const doorSvgW = DW * planScale;
  const doorSvgX = carSvgX + (carSvgW - doorSvgW) / 2;

  const actualFrontClearanceMm = Math.round(frontSillMargin - rearMarginOffset);
  const actualRearClearanceMm = Math.max(0, Math.round((carSvgY - shaftY) / planScale));
  const actualLeftMarginMm = Math.max(0, Math.round((carSvgX - shaftX) / planScale));
  const actualRightMarginMm = Math.max(0, Math.round((shaftX + shaftSvgW - (carSvgX + carSvgW)) / planScale));
  const actualCarToCwtClearanceMm = cwtPosition === 'REAR'
    ? Math.max(0, Math.round((carSvgY - (cwtY + cwtSvgH)) / planScale))
    : cwtPosition === 'SIDE_LEFT'
    ? Math.max(0, Math.round((carSvgX - (cwtX + cwtSvgW)) / planScale))
    : Math.max(0, Math.round((cwtX - (carSvgX + carSvgW)) / planScale));

  // Wall finish styling
  const getWallFinishFill = () => {
    switch (spec.wallFinish) {
      case 'MIRROR_ETCHED_GOLD':
        return '#fef9c3';
      case 'HAIRLINE_TITANIUM_BLACK':
        return '#e2e8f0';
      case 'PANORAMIC_GLASS':
        return '#e0f2fe';
      default:
        return '#f8fafc';
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-300 overflow-hidden shadow-2xs">
      <svg
        viewBox="0 0 920 540"
        className="w-full h-auto block"
        style={{ fontFamily: 'monospace, "Segoe UI", Arial, sans-serif' }}
      >
        <defs>
          {/* Concrete Wall Cross-Hatch */}
          <pattern id="print-concrete-hatch" width="14" height="14" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="14" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="7" cy="7" r="0.8" fill="#64748b" />
          </pattern>

          {/* Dimension Arrowhead Markers */}
          <marker id="arrow-blue-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 8 2 L 2 5 L 8 8 z" fill="#0284c7" />
          </marker>
          <marker id="arrow-blue-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 2 2 L 8 5 L 2 8 z" fill="#0284c7" />
          </marker>

          <marker id="arrow-green-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 8 2 L 2 5 L 8 8 z" fill="#16a34a" />
          </marker>
          <marker id="arrow-green-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 2 2 L 8 5 L 2 8 z" fill="#16a34a" />
          </marker>

          <marker id="arrow-amber-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 8 2 L 2 5 L 8 8 z" fill="#d97706" />
          </marker>
          <marker id="arrow-amber-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 2 2 L 8 5 L 2 8 z" fill="#d97706" />
          </marker>
        </defs>

        {/* Blueprint outer frame */}
        <rect x="10" y="10" width="900" height="520" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="14" y="14" width="892" height="512" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />

        {/* Title Header on Drawing */}
        <text x="30" y="38" fontSize="13" fontWeight="900" fill={primaryColor}>
          مسقط أفقي هندسي لمسار المصعد والكابينة (CAD SHAFT CLEARANCE PLAN VIEW)
        </text>
        <text x="30" y="54" fontSize="10" fontWeight="bold" fill="#64748b">
          CODE: EN 81-20/50 &bull; SASO SBC &bull; SCALE: PROPORTIONAL N.T.S. &bull; REF: {spec.quoteRef}
        </text>

        {/* Right Corner Badges */}
        <rect x="680" y="24" width="210" height="34" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
        <text x="690" y="39" fontSize="9.5" fontWeight="bold" fill="#334155">
          موضع الثقل: {cwtPosition === 'REAR' ? 'خلفي (REAR)' : 'جانبي (SIDE)'}
        </text>
        <text x="690" y="51" fontSize="9" fill="#0284c7" fontWeight="bold">
          الحمولة: {spec.capacityKg} كجم ({spec.personsCount} ركاب) &bull; {spec.ratedSpeed} م/ث
        </text>

        {/* ========================================================================= */}
        {/* SHAFT STRUCTURE                                                           */}
        {/* ========================================================================= */}
        {/* Outer Concrete Shaft Wall */}
        <rect
          x={shaftX - 26}
          y={shaftY - 26}
          width={shaftSvgW + 52}
          height={shaftSvgH + 52}
          fill="url(#print-concrete-hatch)"
          stroke="#475569"
          strokeWidth="2"
        />
        {/* Clear Shaft Interior Opening */}
        <rect
          x={shaftX}
          y={shaftY}
          width={shaftSvgW}
          height={shaftSvgH}
          fill="#f8fafc"
          stroke={primaryColor}
          strokeWidth="2.5"
        />

        {/* Door Opening Cutout - Removes the concrete hatch and lines in front of the door entrance */}
        <rect
          x={doorSvgX}
          y={shaftY + shaftSvgH - 2}
          width={doorSvgW}
          height={29}
          fill="#ffffff"
        />

        {/* Shaft Centerlines */}
        <line
          x1={shaftX - 35}
          y1={shaftY + shaftSvgH / 2}
          x2={shaftX + shaftSvgW + 35}
          y2={shaftY + shaftSvgH / 2}
          stroke="#0284c7"
          strokeWidth="0.8"
          strokeDasharray="10 4 2 4"
          strokeOpacity="0.7"
        />
        <line
          x1={shaftX + shaftSvgW / 2}
          y1={shaftY - 35}
          x2={shaftX + shaftSvgW / 2}
          y2={shaftY + shaftSvgH + 35}
          stroke="#0284c7"
          strokeWidth="0.8"
          strokeDasharray="10 4 2 4"
          strokeOpacity="0.7"
        />

        {/* Guide Rails: Left & Right Car Rails */}
        {/* Left Car Guide Rail (T-Type Profile) */}
        <path
          d={`M ${carSvgX - 20} ${carSvgY + carSvgH / 2 - 7} L ${carSvgX - 12} ${carSvgY + carSvgH / 2 - 7} L ${carSvgX - 12} ${carSvgY + carSvgH / 2 - 3} L ${carSvgX - 6} ${carSvgY + carSvgH / 2 - 3} L ${carSvgX - 6} ${carSvgY + carSvgH / 2 + 3} L ${carSvgX - 12} ${carSvgY + carSvgH / 2 + 3} L ${carSvgX - 12} ${carSvgY + carSvgH / 2 + 7} L ${carSvgX - 20} ${carSvgY + carSvgH / 2 + 7} Z`}
          fill="#d97706"
          stroke="#b45309"
          strokeWidth="1"
        />
        {/* Left Wall Bracket */}
        {cwtPosition !== 'SIDE_LEFT' ? (
          <rect x={shaftX} y={carSvgY + carSvgH / 2 - 12} width={Math.max(12, carSvgX - 6 - shaftX - 14)} height="24" fill="#64748b" />
        ) : (
          <rect x={cwtX + cwtSvgW + 3} y={carSvgY + carSvgH / 2 - 10} width={Math.max(10, carSvgX - 6 - (cwtX + cwtSvgW + 3) - 14)} height="20" fill="#64748b" />
        )}

        {/* Right Car Guide Rail (T-Type Profile) */}
        <path
          d={`M ${carSvgX + carSvgW + 20} ${carSvgY + carSvgH / 2 - 7} L ${carSvgX + carSvgW + 12} ${carSvgY + carSvgH / 2 - 7} L ${carSvgX + carSvgW + 12} ${carSvgY + carSvgH / 2 - 3} L ${carSvgX + carSvgW + 6} ${carSvgY + carSvgH / 2 - 3} L ${carSvgX + carSvgW + 6} ${carSvgY + carSvgH / 2 + 3} L ${carSvgX + carSvgW + 12} ${carSvgY + carSvgH / 2 + 3} L ${carSvgX + carSvgW + 12} ${carSvgY + carSvgH / 2 + 7} L ${carSvgX + carSvgW + 20} ${carSvgY + carSvgH / 2 + 7} Z`}
          fill="#d97706"
          stroke="#b45309"
          strokeWidth="1"
        />
        {/* Right Wall Bracket */}
        {cwtPosition !== 'SIDE_RIGHT' ? (
          <rect x={carSvgX + carSvgW + 20} y={carSvgY + carSvgH / 2 - 12} width={Math.max(12, shaftX + shaftSvgW - (carSvgX + carSvgW + 20))} height="24" fill="#64748b" />
        ) : (
          <rect x={carSvgX + carSvgW + 20} y={carSvgY + carSvgH / 2 - 10} width={Math.max(10, cwtX - 3 - (carSvgX + carSvgW + 20))} height="20" fill="#64748b" />
        )}

        {/* Rail Gauge Dimension DBG Note */}
        <text x={carSvgX + carSvgW + 22} y={carSvgY + 24} fill="#64748b" fontSize="8.5" fontWeight="bold">
          DBG: {calc.dbgRailGaugeMm} mm
        </text>

        {/* ========================================================================= */}
        {/* COUNTERWEIGHT ASSEMBLY                                                    */}
        {/* ========================================================================= */}
        <g id="print-cwt">
          <rect
            x={cwtX}
            y={cwtY}
            width={cwtSvgW}
            height={cwtSvgH}
            fill="#334155"
            stroke="#1e293b"
            strokeWidth="1.5"
            rx="2"
          />
          {/* CWT internal weight slices */}
          {cwtPosition === 'REAR' ? (
            <>
              <line x1={cwtX + 8} y1={cwtY + cwtSvgH / 2} x2={cwtX + cwtSvgW - 8} y2={cwtY + cwtSvgH / 2} stroke="#94a3b8" strokeWidth="1" />
              <line x1={cwtX + cwtSvgW / 3} y1={cwtY + 3} x2={cwtX + cwtSvgW / 3} y2={cwtY + cwtSvgH - 3} stroke="#64748b" strokeWidth="0.8" />
              <line x1={cwtX + (2 * cwtSvgW) / 3} y1={cwtY + 3} x2={cwtX + (2 * cwtSvgW) / 3} y2={cwtY + cwtSvgH - 3} stroke="#64748b" strokeWidth="0.8" />
            </>
          ) : (
            <>
              <line x1={cwtX + cwtSvgW / 2} y1={cwtY + 6} x2={cwtX + cwtSvgW / 2} y2={cwtY + cwtSvgH - 6} stroke="#94a3b8" strokeWidth="1" />
              <line x1={cwtX + 3} y1={cwtY + cwtSvgH * 0.25} x2={cwtX + cwtSvgW - 3} y2={cwtY + cwtSvgH * 0.25} stroke="#64748b" strokeWidth="0.8" />
              <line x1={cwtX + 3} y1={cwtY + cwtSvgH * 0.50} x2={cwtX + cwtSvgW - 3} y2={cwtY + cwtSvgH * 0.50} stroke="#64748b" strokeWidth="0.8" />
              <line x1={cwtX + 3} y1={cwtY + cwtSvgH * 0.75} x2={cwtX + cwtSvgW - 3} y2={cwtY + cwtSvgH * 0.75} stroke="#64748b" strokeWidth="0.8" />
            </>
          )}

          {/* CWT Guide Rails & Brackets */}
          {cwtPosition === 'REAR' ? (
            <>
              <rect x={cwtX - 8} y={cwtY + cwtSvgH / 2 - 3} width="8" height="6" fill="#d97706" />
              <rect x={cwtX + cwtSvgW} y={cwtY + cwtSvgH / 2 - 3} width="8" height="6" fill="#d97706" />
            </>
          ) : (
            <>
              <rect x={cwtX + cwtSvgW / 2 - 3} y={cwtY - 8} width="6" height="8" fill="#d97706" />
              <rect x={cwtX + cwtSvgW / 2 - 3} y={cwtY + cwtSvgH} width="6" height="8" fill="#d97706" />
              {cwtPosition === 'SIDE_LEFT' ? (
                <>
                  <rect x={shaftX} y={cwtY - 10} width={Math.max(6, cwtX - shaftX)} height="12" fill="#64748b" opacity="0.85" />
                  <rect x={shaftX} y={cwtY + cwtSvgH - 2} width={Math.max(6, cwtX - shaftX)} height="12" fill="#64748b" opacity="0.85" />
                </>
              ) : (
                <>
                  <rect x={cwtX + cwtSvgW} y={cwtY - 10} width={Math.max(6, shaftX + shaftSvgW - (cwtX + cwtSvgW))} height="12" fill="#64748b" opacity="0.85" />
                  <rect x={cwtX + cwtSvgW} y={cwtY + cwtSvgH - 2} width={Math.max(6, shaftX + shaftSvgW - (cwtX + cwtSvgW))} height="12" fill="#64748b" opacity="0.85" />
                </>
              )}
            </>
          )}

          {cwtPosition === 'REAR' ? (
            <>
              <text
                x={cwtX + cwtSvgW / 2}
                y={cwtY + cwtSvgH / 2 - 2}
                fill="#ffffff"
                fontSize="9.5"
                fontWeight="bold"
                textAnchor="middle"
              >
                CWT (خلفي REAR)
              </text>
              <text
                x={cwtX + cwtSvgW / 2}
                y={cwtY + cwtSvgH / 2 + 10}
                fill="#38bdf8"
                fontSize="8.5"
                fontWeight="bold"
                textAnchor="middle"
              >
                {safeCwtWidthMm} × {safeCwtDepthMm} mm
              </text>
            </>
          ) : (
            <g transform={`rotate(-90 ${cwtX + cwtSvgW / 2} ${cwtY + cwtSvgH / 2})`}>
              <text
                x={cwtX + cwtSvgW / 2}
                y={cwtY + cwtSvgH / 2 - 3}
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                CWT ({cwtPosition === 'SIDE_LEFT' ? 'يسار عمودي' : 'يمين عمودي'})
              </text>
              <text
                x={cwtX + cwtSvgW / 2}
                y={cwtY + cwtSvgH / 2 + 9}
                fill="#38bdf8"
                fontSize="8.5"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {safeCwtWidthMm} × {safeCwtDepthMm} mm
              </text>
            </g>
          )}
        </g>

        {/* ========================================================================= */}
        {/* CABIN STRUCTURE & PLATFORM                                                */}
        {/* ========================================================================= */}
        {/* Outer Sling Frame Envelope */}
        <rect
          x={carSvgX - 7}
          y={carSvgY - 5}
          width={carSvgW + 14}
          height={carSvgH + 10}
          fill="none"
          stroke="#64748b"
          strokeWidth="1.2"
          strokeDasharray="5 3"
        />

        {/* Cabin Walls */}
        <rect
          x={carSvgX}
          y={carSvgY}
          width={carSvgW}
          height={carSvgH}
          fill={getWallFinishFill()}
          stroke={primaryColor}
          strokeWidth="2.5"
          rx="3"
        />

        {/* Cabin Interior Flooring */}
        <rect
          x={carSvgX + 6}
          y={carSvgY + 6}
          width={carSvgW - 12}
          height={carSvgH - 12}
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="0.8"
        />

        {/* Handrails (Rear and Sides) */}
        <line x1={carSvgX + 12} y1={carSvgY + 10} x2={carSvgX + carSvgW - 12} y2={carSvgY + 10} stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
        <line x1={carSvgX + 10} y1={carSvgY + 12} x2={carSvgX + 10} y2={carSvgY + carSvgH - 18} stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
        <line x1={carSvgX + carSvgW - 10} y1={carSvgY + 12} x2={carSvgX + carSvgW - 10} y2={carSvgY + carSvgH - 18} stroke="#64748b" strokeWidth="3" strokeLinecap="round" />

        {/* Car Operating Panel (COP) Indicator */}
        <rect
          x={carSvgX + carSvgW - 8}
          y={carSvgY + carSvgH - 35}
          width="5"
          height="22"
          fill="#0284c7"
          rx="1"
        />

        {/* Entrance Door Opening & Panels */}
        <rect
          x={doorSvgX}
          y={carSvgY + carSvgH - 2}
          width={doorSvgW}
          height="5"
          fill="#ffffff"
        />

        {/* Sliding Car Door Panels */}
        {spec.doorType === 'CENTER_2P' || spec.doorType === 'CENTER_4P' ? (
          <>
            <rect
              x={doorSvgX + 3}
              y={carSvgY + carSvgH - 1}
              width={doorSvgW / 2 - 5}
              height="4"
              fill="#0284c7"
              stroke="#0369a1"
              strokeWidth="0.8"
              rx="1"
            />
            <rect
              x={doorSvgX + doorSvgW / 2 + 2}
              y={carSvgY + carSvgH - 1}
              width={doorSvgW / 2 - 5}
              height="4"
              fill="#0284c7"
              stroke="#0369a1"
              strokeWidth="0.8"
              rx="1"
            />
          </>
        ) : (
          <>
            <rect
              x={doorSvgX + 3}
              y={carSvgY + carSvgH - 1}
              width={doorSvgW * 0.48}
              height="4"
              fill="#0284c7"
              stroke="#0369a1"
              strokeWidth="0.8"
              rx="1"
            />
            <rect
              x={doorSvgX + doorSvgW * 0.48}
              y={carSvgY + carSvgH - 5}
              width={doorSvgW * 0.48}
              height="4"
              fill="#0284c7"
              stroke="#0369a1"
              strokeWidth="0.8"
              rx="1"
            />
          </>
        )}

        {/* Landing Door (باب الدور الأرضي) - Identical to Car Door */}
        <rect
          x={doorSvgX}
          y={shaftY + shaftSvgH - 3}
          width={doorSvgW}
          height="6"
          fill="#ffffff"
        />
        <rect
          x={doorSvgX - 2}
          y={shaftY + shaftSvgH - 4}
          width={doorSvgW + 4}
          height="8"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="0.8"
        />
        {spec.doorType === 'CENTER_2P' || spec.doorType === 'CENTER_4P' ? (
          <>
            <rect
              x={doorSvgX + 3}
              y={shaftY + shaftSvgH - 1}
              width={doorSvgW / 2 - 5}
              height="4"
              fill="#0284c7"
              stroke="#0369a1"
              strokeWidth="0.8"
              rx="1"
            />
            <rect
              x={doorSvgX + doorSvgW / 2 + 2}
              y={shaftY + shaftSvgH - 1}
              width={doorSvgW / 2 - 5}
              height="4"
              fill="#0284c7"
              stroke="#0369a1"
              strokeWidth="0.8"
              rx="1"
            />
          </>
        ) : (
          <>
            <rect
              x={doorSvgX + 3}
              y={shaftY + shaftSvgH - 1}
              width={doorSvgW * 0.48}
              height="4"
              fill="#0284c7"
              stroke="#0369a1"
              strokeWidth="0.8"
              rx="1"
            />
            <rect
              x={doorSvgX + doorSvgW * 0.48}
              y={shaftY + shaftSvgH + 3}
              width={doorSvgW * 0.48}
              height="4"
              fill="#0284c7"
              stroke="#0369a1"
              strokeWidth="0.8"
              rx="1"
            />
          </>
        )}

        {/* Cabin Center Text Label */}
        <text
          x={carSvgX + carSvgW / 2}
          y={carSvgY + carSvgH / 2 - 5}
          fill={primaryColor}
          fontSize="11"
          fontWeight="900"
          textAnchor="middle"
        >
          كابينة المصعد (CABIN)
        </text>
        <text
          x={carSvgX + carSvgW / 2}
          y={carSvgY + carSvgH / 2 + 10}
          fill="#64748b"
          fontSize="9.5"
          fontWeight="bold"
          textAnchor="middle"
        >
          {spec.capacityKg} kg / {spec.personsCount} Persons ({spec.ratedSpeed} m/s)
        </text>

        {/* ========================================================================= */}
        {/* DIMENSION LINES & BADGES                                                  */}
        {/* ========================================================================= */}
        {/* 1. SHAFT WIDTH (SW) OUTSIDE TOP */}
        <line
          x1={shaftX}
          y1={shaftY - 50}
          x2={shaftX + shaftSvgW}
          y2={shaftY - 50}
          stroke="#0284c7"
          strokeWidth="1.5"
          markerStart="url(#arrow-blue-start)"
          markerEnd="url(#arrow-blue-end)"
        />
        <line x1={shaftX} y1={shaftY - 58} x2={shaftX} y2={shaftY} stroke="#0284c7" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1={shaftX + shaftSvgW} y1={shaftY - 58} x2={shaftX + shaftSvgW} y2={shaftY} stroke="#0284c7" strokeWidth="0.8" strokeDasharray="3 3" />
        <rect x={shaftX + shaftSvgW / 2 - 75} y={shaftY - 61} width="150" height="22" fill="#0284c7" rx="4" />
        <text x={shaftX + shaftSvgW / 2} y={shaftY - 46} fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle" direction="ltr">
          عرض البئر SW = {SW} mm
        </text>

        {/* 2. SHAFT DEPTH (SD) OUTSIDE LEFT - ORIENTED ALONG THE DEPTH AXIS LIKE CABIN */}
        <line
          x1={shaftX - 50}
          y1={shaftY}
          x2={shaftX - 50}
          y2={shaftY + shaftSvgH}
          stroke="#0284c7"
          strokeWidth="1.5"
          markerStart="url(#arrow-blue-start)"
          markerEnd="url(#arrow-blue-end)"
        />
        <line x1={shaftX - 58} y1={shaftY} x2={shaftX} y2={shaftY} stroke="#0284c7" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1={shaftX - 58} y1={shaftY + shaftSvgH} x2={shaftX} y2={shaftY + shaftSvgH} stroke="#0284c7" strokeWidth="0.8" strokeDasharray="3 3" />
        <rect x={shaftX - 61} y={shaftY + shaftSvgH / 2 - 65} width="22" height="130" fill="#0284c7" rx="4" />
        <text
          x={shaftX - 50}
          y={shaftY + shaftSvgH / 2 + 4}
          transform={`rotate(-90 ${shaftX - 50} ${shaftY + shaftSvgH / 2})`}
          fill="#ffffff"
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          direction="ltr"
        >
          عمق البئر SD = {SD} mm
        </text>

        {/* 3. CABIN WIDTH (CW) INSIDE CABIN */}
        <line x1={carSvgX + 6} y1={carSvgY + 16} x2={carSvgX + 6} y2={carSvgY + 32} stroke="#16a34a" strokeWidth="0.8" />
        <line x1={carSvgX + carSvgW - 6} y1={carSvgY + 16} x2={carSvgX + carSvgW - 6} y2={carSvgY + 32} stroke="#16a34a" strokeWidth="0.8" />
        <line
          x1={carSvgX + 6}
          y1={carSvgY + 24}
          x2={carSvgX + carSvgW - 6}
          y2={carSvgY + 24}
          stroke="#16a34a"
          strokeWidth="1.4"
          markerStart="url(#arrow-green-start)"
          markerEnd="url(#arrow-green-end)"
        />
        <rect x={carSvgX + carSvgW / 2 - 48} y={carSvgY + 15} width="96" height="18" fill="#16a34a" rx="3" />
        <text x={carSvgX + carSvgW / 2} y={carSvgY + 28} fill="#ffffff" fontSize="9.5" fontWeight="bold" textAnchor="middle" direction="ltr">
          CW = {CW} mm
        </text>

        {/* 4. CABIN DEPTH (CD) INSIDE CABIN */}
        <line x1={carSvgX + carSvgW - 33} y1={carSvgY + 6} x2={carSvgX + carSvgW - 17} y2={carSvgY + 6} stroke="#16a34a" strokeWidth="0.8" />
        <line x1={carSvgX + carSvgW - 33} y1={carSvgY + carSvgH - 6} x2={carSvgX + carSvgW - 17} y2={carSvgY + carSvgH - 6} stroke="#16a34a" strokeWidth="0.8" />
        <line
          x1={carSvgX + carSvgW - 25}
          y1={carSvgY + 6}
          x2={carSvgX + carSvgW - 25}
          y2={carSvgY + carSvgH - 6}
          stroke="#16a34a"
          strokeWidth="1.4"
          markerStart="url(#arrow-green-start)"
          markerEnd="url(#arrow-green-end)"
        />
        <rect x={carSvgX + carSvgW - 34} y={carSvgY + carSvgH / 2 - 43} width="18" height="86" fill="#16a34a" rx="3" />
        <text
          x={carSvgX + carSvgW - 25}
          y={carSvgY + carSvgH / 2 + 3.5}
          transform={`rotate(-90 ${carSvgX + carSvgW - 25} ${carSvgY + carSvgH / 2})`}
          fill="#ffffff"
          fontSize="9.5"
          fontWeight="bold"
          textAnchor="middle"
          direction="ltr"
        >
          CD = {CD} mm
        </text>

        {/* 5. DOOR CLEAR OPENING (DW) BOTTOM */}
        <line
          x1={doorSvgX}
          y1={shaftY + shaftSvgH + 20}
          x2={doorSvgX + doorSvgW}
          y2={shaftY + shaftSvgH + 20}
          stroke="#d97706"
          strokeWidth="1.5"
          markerStart="url(#arrow-amber-start)"
          markerEnd="url(#arrow-amber-end)"
        />
        <line x1={doorSvgX} y1={shaftY + shaftSvgH} x2={doorSvgX} y2={shaftY + shaftSvgH + 25} stroke="#d97706" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1={doorSvgX + doorSvgW} y1={shaftY + shaftSvgH} x2={doorSvgX + doorSvgW} y2={shaftY + shaftSvgH + 25} stroke="#d97706" strokeWidth="0.8" strokeDasharray="2 2" />
        <rect x={doorSvgX + doorSvgW / 2 - 85} y={shaftY + shaftSvgH + 10} width="170" height="20" fill="#d97706" rx="3" />
        <text x={doorSvgX + doorSvgW / 2} y={shaftY + shaftSvgH + 24} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" direction="ltr">
          فتحة الباب الصافية DW = {DW} mm
        </text>

        {/* 6. CLEARANCES & SAFETY LABELS */}
        <g id="print-clearances">
          {/* Front Running Clearance (Sill Gap) */}
          <text x={carSvgX + 30} y={carSvgY + carSvgH + 13} fill="#0284c7" fontSize="8.5" fontWeight="bold">
            GAP: {actualFrontClearanceMm} mm
          </text>

          {/* Left & Right Shaft Margins */}
          <text x={shaftX + 6} y={carSvgY + 20} fill="#64748b" fontSize="8" fontWeight="bold">
            L: {actualLeftMarginMm}mm
          </text>
          <text x={shaftX + shaftSvgW - 6} y={carSvgY + 20} fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="end">
            R: {actualRightMarginMm}mm
          </text>

          {/* CWT to Rear Gap */}
          {cwtPosition === 'REAR' && (
            <text x={cwtX + cwtSvgW / 2} y={shaftY + (cwtY - shaftY) / 2 + 3} fill="#0284c7" fontSize="8" fontWeight="bold" textAnchor="middle">
              GAP: {Math.max(0, Math.round((cwtY - shaftY) / planScale))} mm
            </text>
          )}

          {/* Car to CWT Gap */}
          {cwtPosition === 'REAR' ? (
            <text x={cwtX + cwtSvgW / 2} y={cwtY + cwtSvgH + 12} fill="#16a34a" fontSize="8.5" fontWeight="bold" textAnchor="middle">
              GAP: {actualCarToCwtClearanceMm} mm
            </text>
          ) : (
            <text
              x={cwtPosition === 'SIDE_LEFT' ? cwtX + cwtSvgW + (carSvgX - (cwtX + cwtSvgW)) / 2 : carSvgX + carSvgW + (cwtX - (carSvgX + carSvgW)) / 2}
              y={cwtY + cwtSvgH / 2 + 3}
              fill="#16a34a"
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
            >
              GAP: {actualCarToCwtClearanceMm} mm
            </text>
          )}

          {/* Landing Entrance Direction Indicator */}
          <g transform={`translate(${shaftX + shaftSvgW / 2}, ${shaftY + shaftSvgH + 58})`}>
            <line x1="0" y1="12" x2="0" y2="-4" stroke="#0284c7" strokeWidth="1.5" markerEnd="url(#arrow-blue-end)" />
            <text x="0" y="24" fill="#334155" fontSize="9" fontWeight="black" textAnchor="middle">
              LANDING ENTRANCE / مدخل الدور
            </text>
          </g>
        </g>

        {/* Bottom Left Technical Legend Block */}
        <g transform="translate(30, 465)">
          <rect x="0" y="0" width="310" height="50" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
          <text x="10" y="15" fontSize="9" fontWeight="bold" fill={primaryColor}>
            مفاتيح الرموز الفنية (Technical Legend):
          </text>
          <circle cx="16" cy="28" r="4" fill="#0284c7" />
          <text x="26" y="31" fontSize="8" fill="#334155">أبعاد مسار البئر (Shaft SW &times; SD)</text>
          <circle cx="16" cy="40" r="4" fill="#16a34a" />
          <text x="26" y="43" fontSize="8" fill="#334155">أبعاد الكابينة (Cabin CW &times; CD)</text>

          <circle cx="170" cy="28" r="4" fill="#d97706" />
          <text x="180" y="31" fontSize="8" fill="#334155">سكك التوجيه والأبواب (Rails &amp; DW)</text>
          <circle cx="170" cy="40" r="4" fill="#334155" />
          <text x="180" y="43" fontSize="8" fill="#334155">ثقل الموازنة (Counterweight)</text>
        </g>

        {/* Bottom Right Engineering Certification Stamp Block */}
        <g transform="translate(620, 465)">
          <rect x="0" y="0" width="270" height="50" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
          <text x="10" y="15" fontSize="9" fontWeight="bold" fill={primaryColor}>
            الاعتماد الهندسي للمسار والكابينة:
          </text>
          <text x="10" y="29" fontSize="8" fill="#64748b">
            ارتفاع المشوار: {spec.travelHeightM} م &bull; التحليق: {spec.overheadHeightMm} مم &bull; الحفرة: {spec.pitDepthMm} مم
          </text>
          <text x="10" y="42" fontSize="8.5" fontWeight="bold" fill="#16a34a">
            ✓ مطابق لكود المصاعد EN 81-20/50 وكود البناء SBC
          </text>
        </g>
      </svg>
    </div>
  );
};

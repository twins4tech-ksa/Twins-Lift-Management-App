import React from 'react';
import { ElevatorSpecification } from '../types/elevator';
import { calculateElevatorEngineering } from '../utils/elevatorCalculations';

interface Props {
  spec: ElevatorSpecification;
  primaryColor?: string;
  accentColor?: string;
}

export const CadPrintElevationDrawing: React.FC<Props> = ({
  spec,
  primaryColor = '#172033',
  accentColor = '#b6be49',
}) => {
  const calc = calculateElevatorEngineering(spec);
  const CW = spec.cabinWidthMm;
  const CD = spec.cabinDepthMm;

  return (
    <div className="w-full bg-white rounded-xl border border-slate-300 overflow-hidden shadow-2xs">
      <svg
        viewBox="0 0 920 540"
        className="w-full h-auto block"
        style={{ fontFamily: 'monospace, "Segoe UI", Arial, sans-serif' }}
      >
        <defs>
          <pattern id="elev-concrete-hatch" width="14" height="14" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="14" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="7" cy="7" r="0.8" fill="#64748b" />
          </pattern>

          <marker id="elev-arrow-blue-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 8 2 L 2 5 L 8 8 z" fill="#0284c7" />
          </marker>
          <marker id="elev-arrow-blue-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 2 2 L 8 5 L 2 8 z" fill="#0284c7" />
          </marker>

          <marker id="elev-arrow-amber-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 8 2 L 2 5 L 8 8 z" fill="#d97706" />
          </marker>
          <marker id="elev-arrow-amber-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 2 2 L 8 5 L 2 8 z" fill="#d97706" />
          </marker>

          <marker id="elev-arrow-green-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 8 2 L 2 5 L 8 8 z" fill="#16a34a" />
          </marker>
          <marker id="elev-arrow-green-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 2 2 L 8 5 L 2 8 z" fill="#16a34a" />
          </marker>
        </defs>

        {/* Outer Frame */}
        <rect x="10" y="10" width="900" height="520" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="14" y="14" width="892" height="512" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />

        {/* Title */}
        <text x="30" y="38" fontSize="13" fontWeight="900" fill={primaryColor}>
          المقطع الرأسي الهندسي للبئر والارتفاعات (CAD VERTICAL SHAFT SECTION)
        </text>
        <text x="30" y="54" fontSize="10" fontWeight="bold" fill="#64748b">
          CODE: EN 81-20/50 &bull; OVERHEAD, TRAVEL &amp; PIT PROFILES &bull; STOPS: {spec.stops} L &bull; SPEED: {spec.ratedSpeed} m/s
        </text>

        {/* Right Corner Badge */}
        <rect x="680" y="24" width="210" height="34" fill="#f8fafc" stroke="#cbd5e1" rx="4" />
        <text x="690" y="39" fontSize="9.5" fontWeight="bold" fill="#334155">
          ماكينة غير موجهة PMSM بدون غرفة
        </text>
        <text x="690" y="51" fontSize="9" fill="#0284c7" fontWeight="bold">
          قدرة المحرك: {calc.motorPowerKw} kW &bull; نظام التعليق {spec.ropingRatio}
        </text>

        {/* Vertical Shaft Enclosure: Left X: 240, Right X: 640 */}
        <rect x="240" y="75" width="400" height="425" fill="#f8fafc" stroke={primaryColor} strokeWidth="2" />
        {/* Concrete Slabs (Roof & Foundation) */}
        <rect x="200" y="495" width="480" height="30" fill="url(#elev-concrete-hatch)" stroke="#475569" strokeWidth="1.5" />
        <rect x="200" y="45" width="480" height="30" fill="url(#elev-concrete-hatch)" stroke="#475569" strokeWidth="1.5" />

        {/* Machine Assembly at Overhead Slab */}
        <rect x="360" y="80" width="160" height="42" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" rx="3" />
        <circle cx="430" cy="110" r="26" fill="#ffffff" stroke="#d97706" strokeWidth="3" />
        <circle cx="430" cy="110" r="8" fill="#cbd5e1" />
        <circle cx="530" cy="115" r="16" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
        <text x="440" y="96" fill="#1e293b" fontSize="9" fontWeight="bold">
          PMSM Gearless ({calc.motorPowerKw} kW)
        </text>

        {/* Vertical Guide Rails */}
        <line x1="300" y1="80" x2="300" y2="495" stroke="#d97706" strokeWidth="2.5" />
        <line x1="470" y1="80" x2="470" y2="495" stroke="#d97706" strokeWidth="2.5" />
        <line x1="560" y1="80" x2="560" y2="495" stroke="#94a3b8" strokeWidth="2" />

        {/* Floor Landing Levels & Door Openings on Left */}
        {/* Ground Floor (Bottom Landing) */}
        <line x1="200" y1="410" x2="240" y2="410" stroke="#0284c7" strokeWidth="2.5" />
        <rect x="238" y="325" width="6" height="85" fill="#0284c7" />
        <text x="175" y="414" fontSize="9.5" fontWeight="bold" fill="#0284c7">
          الدور الأرضي (FL 1)
        </text>

        {/* Mid Landing (Floor 2) */}
        <line x1="200" y1="280" x2="240" y2="280" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 2" />
        <rect x="238" y="195" width="6" height="85" fill="#64748b" />
        <text x="175" y="284" fontSize="9" fill="#64748b">
          الدور المتكرر (FL 2)
        </text>

        {/* Top Landing (Floor N) */}
        <line x1="200" y1="160" x2="240" y2="160" stroke="#16a34a" strokeWidth="2" />
        <rect x="238" y="75" width="6" height="85" fill="#16a34a" />
        <text x="175" y="164" fontSize="9.5" fontWeight="bold" fill="#16a34a">
          الدور الأخير (FL {spec.stops})
        </text>

        {/* Car Suspended in Shaft */}
        <g transform="translate(305, 230)">
          {/* Sling Upper Beam */}
          <rect x="0" y="0" width="150" height="12" fill="#334155" rx="1" />
          {/* Stiles */}
          <rect x="3" y="12" width="7" height="130" fill="#475569" />
          <rect x="140" y="12" width="7" height="130" fill="#475569" />
          {/* Sling Lower Beam & Safety Gear */}
          <rect x="0" y="142" width="150" height="14" fill="#334155" rx="1" />
          <rect x="2" y="156" width="18" height="10" fill="#dc2626" rx="2" />
          <rect x="130" y="156" width="18" height="10" fill="#dc2626" rx="2" />

          {/* Cabin Box */}
          <rect x="14" y="14" width="122" height="124" fill="#ffffff" stroke={primaryColor} strokeWidth="2" rx="2" />
          <text x="75" y="70" fill={primaryColor} fontSize="10" fontWeight="900" textAnchor="middle">
            الكابينة (CAR)
          </text>
          <text x="75" y="85" fill="#64748b" fontSize="8.5" fontWeight="bold" textAnchor="middle">
            {CW} &times; {CD} mm &bull; CH: {spec.cabinHeightMm} mm
          </text>
          <text x="75" y="98" fill="#0284c7" fontSize="8" fontWeight="bold" textAnchor="middle">
            {spec.capacityKg} kg ({spec.personsCount} P)
          </text>

          {/* Diverter Pulleys Under Car for 2:1 */}
          <circle cx="35" cy="162" r="10" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />
          <circle cx="115" cy="162" r="10" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />
        </g>

        {/* Counterweight Block */}
        <g transform="translate(535, 140)">
          <rect x="0" y="0" width="46" height="120" fill="#334155" stroke="#1e293b" strokeWidth="1.5" rx="2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={i} x1="4" y1={20 + i * 20} x2="42" y2={20 + i * 20} stroke="#94a3b8" strokeWidth="1" />
          ))}
          {spec.ropingRatio === '2:1' ? (
            <circle cx="23" cy="-7" r="10" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />
          ) : (
            <rect x="15" y="-10" width="16" height="10" fill="#d97706" rx="2" />
          )}
          <text x="23" y="62" fill="#1e293b" fontSize="8.5" fontWeight="bold" textAnchor="middle">
            CWT
          </text>
        </g>

        {/* Suspension Steel Wire Ropes (Traction Path) */}
        {spec.ropingRatio === '1:1' ? (
          <g id="print-ropes-1-1">
            {/* Direct from Car Crosshead to Traction Sheave */}
            <line x1="430" y1="230" x2="430" y2="110" stroke="#d97706" strokeWidth="2.5" />
            {/* Arc from Traction Sheave to Deflector */}
            <path d="M 430 84 L 530 99" fill="none" stroke="#d97706" strokeWidth="2.5" />
            {/* From Deflector to CWT Hitch */}
            <line x1="530" y1="115" x2="558" y2="130" stroke="#d97706" strokeWidth="2.5" />
            <text x="440" y="170" fill="#d97706" fontSize="8" fontWeight="bold">تعليق مباشر 1:1</text>
          </g>
        ) : (
          <g id="print-ropes-2-1">
            {/* Fixed overhead hitch 1 (car side) */}
            <rect x="330" y="75" width="16" height="8" fill="#d97706" rx="1" />
            {/* Drop from overhead hitch 1 down to Left Under-Car Pulley (305 + 35 = 340) */}
            <line x1="338" y1="83" x2="338" y2="392" stroke="#d97706" strokeWidth="2" />
            {/* Under Car Ropes from left pulley to right pulley (305 + 115 = 420) */}
            <line x1="338" y1="395" x2="422" y2="395" stroke="#d97706" strokeWidth="2" />
            {/* Up from Right Under-Car Pulley to Traction Sheave (430, 110) */}
            <line x1="422" y1="392" x2="430" y2="110" stroke="#d97706" strokeWidth="2.5" />
            {/* Over Traction Sheave to Deflector */}
            <path d="M 430 84 L 530 99" fill="none" stroke="#d97706" strokeWidth="2.5" />
            {/* Down to CWT Pulley (535 + 23 = 558, 140 - 7 = 133) */}
            <line x1="530" y1="115" x2="550" y2="133" stroke="#d97706" strokeWidth="2" />
            <line x1="566" y1="133" x2="575" y2="75" stroke="#d97706" strokeWidth="2" />
            {/* Fixed overhead hitch 2 (CWT side) */}
            <rect x="567" y="75" width="16" height="8" fill="#d97706" rx="1" />
            <text x="350" y="340" fill="#d97706" fontSize="8" fontWeight="bold">تعليق سفلي 2:1</text>
          </g>
        )}

        {/* Speed Governor Loop (EN 81-20) */}
        <g id="print-gov-loop">
          <circle cx="280" cy="80" r="7" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" />
          <circle cx="280" cy="485" r="7" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" />
          <line x1="273" y1="80" x2="273" y2="485" stroke="#ef4444" strokeWidth="0.9" strokeDasharray="3 1" />
          <line x1="287" y1="80" x2="287" y2="485" stroke="#ef4444" strokeWidth="0.9" strokeDasharray="3 1" />
        </g>

        {/* Pit Springs & Buffers */}
        <g transform="translate(330, 465)">
          {/* Car Buffers */}
          <rect x="15" y="16" width="22" height="14" fill="#d97706" rx="2" />
          <path d="M 26 0 L 26 16 M 18 5 L 34 5 M 18 10 L 34 10" stroke="#d97706" strokeWidth="2" />
          <rect x="85" y="16" width="22" height="14" fill="#d97706" rx="2" />
          <path d="M 96 0 L 96 16 M 88 5 L 104 5 M 88 10 L 104 10" stroke="#d97706" strokeWidth="2" />
          {/* CWT Buffer */}
          <rect x="215" y="16" width="22" height="14" fill="#d97706" rx="2" />
          <path d="M 226 0 L 226 16 M 218 5 L 234 5 M 218 10 L 234 10" stroke="#d97706" strokeWidth="2" />
        </g>

        {/* ========================================================================= */}
        {/* VERTICAL DIMENSIONS & ANNOTATIONS                                         */}
        {/* ========================================================================= */}
        {/* 1. OVERHEAD HEIGHT DIMENSION (TOP SLAB TO TOP LANDING) */}
        <line
          x1="660"
          y1="75"
          x2="660"
          y2="160"
          stroke="#0284c7"
          strokeWidth="1.5"
          markerStart="url(#elev-arrow-blue-start)"
          markerEnd="url(#elev-arrow-blue-end)"
        />
        <line x1="640" y1="75" x2="670" y2="75" stroke="#0284c7" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="640" y1="160" x2="670" y2="160" stroke="#0284c7" strokeWidth="0.8" strokeDasharray="2 2" />
        <rect x="675" y="105" width="200" height="24" fill="#0284c7" rx="3" />
        <text x="685" y="121" fill="#1e293b" fontSize="10" fontWeight="bold">
          ارتفاع التحليق: {spec.overheadHeightMm} mm
        </text>

        {/* 2. TRAVEL HEIGHT DIMENSION (TOP LANDING TO BOTTOM LANDING) */}
        <line
          x1="660"
          y1="160"
          x2="660"
          y2="410"
          stroke="#16a34a"
          strokeWidth="1.5"
          markerStart="url(#elev-arrow-green-start)"
          markerEnd="url(#elev-arrow-green-end)"
        />
        <line x1="640" y1="410" x2="670" y2="410" stroke="#16a34a" strokeWidth="0.8" strokeDasharray="2 2" />
        <rect x="675" y="270" width="200" height="24" fill="#16a34a" rx="3" />
        <text x="685" y="286" fill="#1e293b" fontSize="10" fontWeight="bold">
          مشوار الصعود: {spec.travelHeightM} م ({spec.stops} وقفات)
        </text>

        {/* 3. PIT DEPTH DIMENSION (BOTTOM LANDING TO PIT FLOOR) */}
        <line
          x1="660"
          y1="410"
          x2="660"
          y2="495"
          stroke="#d97706"
          strokeWidth="1.5"
          markerStart="url(#elev-arrow-amber-start)"
          markerEnd="url(#elev-arrow-amber-end)"
        />
        <line x1="640" y1="495" x2="670" y2="495" stroke="#d97706" strokeWidth="0.8" strokeDasharray="2 2" />
        <rect x="675" y="440" width="200" height="24" fill="#d97706" rx="3" />
        <text x="685" y="456" fill="#1e293b" fontSize="10" fontWeight="bold">
          عمق الحفرة: {spec.pitDepthMm} mm
        </text>

        {/* Bottom Left Note */}
        <g transform="translate(30, 475)">
          <text x="0" y="12" fontSize="9" fontWeight="bold" fill={primaryColor}>
            اشتراطات السلامة الرأسية (Safety Clearances EN 81-20):
          </text>
          <text x="0" y="24" fontSize="8" fill="#64748b">
            ملجأ سلامة علوي متوفر &bull; مسافات التوقف الآمن للمصدات معتمدة طبقاً للمواصفات السعودية.
          </text>
        </g>
      </svg>
    </div>
  );
};

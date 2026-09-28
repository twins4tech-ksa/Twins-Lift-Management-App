import React, { useState, useEffect, useRef } from 'react';
import { ElevatorSpecification } from '../types/elevator';
import { calculateElevatorEngineering } from '../utils/elevatorCalculations';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Layers, 
  Info, 
  CheckCircle2, 
  ShieldCheck, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  Maximize2 
} from 'lucide-react';

export type SuspensionArrangement = '2:1_UNDERSLUNG' | '1:1_DIRECT' | '2:1_OVERSLUNG';

interface Props {
  spec: ElevatorSpecification;
  isAr?: boolean;
  onUpdateRoping?: (roping: '1:1' | '2:1') => void;
  className?: string;
}

export const SuspensionElevationCAD: React.FC<Props> = ({
  spec,
  isAr = true,
  onUpdateRoping,
  className = '',
}) => {
  const calc = calculateElevatorEngineering(spec);

  // Active Suspension Configuration
  const [suspensionType, setSuspensionType] = useState<SuspensionArrangement>(() => {
    return spec.ropingRatio === '1:1' ? '1:1_DIRECT' : '2:1_UNDERSLUNG';
  });

  // Sync with prop if it changes
  useEffect(() => {
    if (spec.ropingRatio === '1:1' && suspensionType !== '1:1_DIRECT') {
      setSuspensionType('1:1_DIRECT');
    } else if (spec.ropingRatio === '2:1' && suspensionType === '1:1_DIRECT') {
      setSuspensionType('2:1_UNDERSLUNG');
    }
  }, [spec.ropingRatio]);

  // Car Position Simulation: 0 = Bottom Floor, 100 = Top Floor
  const [carPositionPercent, setCarPositionPercent] = useState<number>(35);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simDirection, setSimDirection] = useState<'UP' | 'DOWN'>('UP');

  // Display layers toggles
  const [showGovernorLoop, setShowGovernorLoop] = useState<boolean>(true);
  const [showTravelingCable, setShowTravelingCable] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showComponentLabels, setShowComponentLabels] = useState<boolean>(true);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Auto animation loop
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isSimulating) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      setCarPositionPercent((prev) => {
        const speed = 25; // percent per second
        let next = simDirection === 'UP' ? prev + speed * delta : prev - speed * delta;
        if (next >= 96) {
          next = 96;
          setSimDirection('DOWN');
        } else if (next <= 4) {
          next = 4;
          setSimDirection('UP');
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSimulating, simDirection]);

  // Handle switching suspension
  const handleSelectSuspension = (type: SuspensionArrangement) => {
    setSuspensionType(type);
    const roping = type === '1:1_DIRECT' ? '1:1' : '2:1';
    onUpdateRoping?.(roping);
  };

  // =========================================================================
  // GEOMETRY & COORDINATES ENGINE
  // =========================================================================
  // Canvas ViewBox: 0 0 940 680
  const shaftLeft = 220;
  const shaftRight = 660;
  const shaftWidth = shaftRight - shaftLeft; // 440
  const overheadCeilingY = 70;
  const pitFloorY = 570;
  const pitDepthSvg = 80;
  const overheadHeightSvg = 90;

  // Car travel bounds in SVG coordinates
  // Bottom landing level: Y = 490 (car rests ~15px above bottom buffer)
  // Top landing level: Y = 160 (car rests with proper safety overhead clearance)
  const carBottomY = 410; // Car floor level at bottom
  const carTopY = 190;    // Car floor level at top
  const currentCarFloorY = carBottomY - (carPositionPercent / 100) * (carBottomY - carTopY);

  // Car dimensions in Section
  const carWidth = 160;
  const carHeight = 140;
  const carLeft = 285;
  const carRight = carLeft + carWidth; // 445
  const carCenterX = carLeft + carWidth / 2; // 365
  const carTopSlingY = currentCarFloorY - carHeight; // Upper crosshead beam Y

  // Counterweight position (reciprocal motion to Car)
  // When car is at bottom (0%), CWT is near top (100%)
  // When car is at top (100%), CWT is near bottom (0%)
  const cwtWidth = 48;
  const cwtHeight = 130;
  const cwtLeft = 555;
  const cwtRight = cwtLeft + cwtWidth; // 603
  const cwtCenterX = cwtLeft + cwtWidth / 2; // 579
  const cwtBottomY = 420;
  const cwtTopY = 175;
  const currentCwtTopY = cwtTopY + (carPositionPercent / 100) * (cwtBottomY - cwtTopY);

  // Machine & Sheaves Coordinates
  // Traction Drive Sheave
  const tractionSheaveX = 430;
  const tractionSheaveY = 105;
  const tractionSheaveRadius = 26; // ~400mm in scale

  // Deflector / Diverter Sheave (aligned with CWT centerline)
  const deflectorSheaveX = cwtCenterX - 8; // ~571
  const deflectorSheaveY = 112;
  const deflectorSheaveRadius = 18; // ~320mm in scale

  // Under-Car Pulleys (for 2:1 Underslung)
  const carPulleyLeftX = carLeft + 32;  // 317
  const carPulleyRightX = carRight - 32; // 413
  const carUnderPulleyY = currentCarFloorY + 18; // beneath safety plank
  const carPulleyRadius = 12;

  // Over-Car Pulleys (for 2:1 Overslung)
  const carOverPulleyLeftX = carLeft + 35;
  const carOverPulleyRightX = carRight - 35;
  const carOverPulleyY = carTopSlingY - 12;

  // Counterweight Pulley (for 2:1)
  const cwtPulleyX = cwtCenterX;
  const cwtPulleyY = currentCwtTopY - 8;
  const cwtPulleyRadius = 12;

  // Dead-end Hitch Points on Overhead Slab (for 2:1)
  const carOverheadHitchX = 295; // Top fixed hitch for car side
  const carOverheadHitchY = overheadCeilingY + 6;
  const cwtOverheadHitchX = cwtCenterX + 16; // Top fixed hitch for CWT side
  const cwtOverheadHitchY = overheadCeilingY + 6;

  // Governor & Pit Tension Coordinates
  const govSheaveX = 260;
  const govSheaveY = overheadCeilingY + 8;
  const pitGovSheaveX = 260;
  const pitGovSheaveY = pitFloorY - 24;

  // Traveling Cable Parabola Calculation
  const cableWallAnchorX = shaftLeft + 6;
  const cableWallAnchorY = 320; // Mid-shaft fixed connection
  const cableCarAnchorX = carLeft + 25;
  const cableCarAnchorY = currentCarFloorY + 6;
  const cableLoopBottomY = Math.min(pitFloorY - 40, Math.max(cableWallAnchorY, cableCarAnchorY) + 70);

  // Wire ropes specifications
  const ropeCount = spec.capacityKg >= 1000 ? 6 : spec.capacityKg >= 630 ? 5 : 4;
  const ropeDiameterMm = 10;
  const carSpeedMs = spec.ratedSpeed || 1.0;
  const ropeSpeedMs = suspensionType === '1:1_DIRECT' ? carSpeedMs : carSpeedMs * 2;
  const motorTorqueFactor = suspensionType === '1:1_DIRECT' ? '100% (High Torque Motor)' : '50% (Compact PMSM)';

  return (
    <div className={`flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden ${className}`}>
      {/* ===================================================================== */}
      {/* HEADER CONTROLS BAR: SUSPENSION SCHEMES & MOTION SIMULATOR           */}
      {/* ===================================================================== */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>{isAr ? 'المقطع الرأسي الهندسي ونظام التعليق (CAD Suspension System)' : 'Vertical CAD Elevation & Suspension System'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                EN 81-20/50
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {isAr 
                ? 'رسم هندسي متكامل لمسار حبال الجر، طارات التوجيه، منظم السرعة، ومصدات الهبوط' 
                : 'Full engineering CAD of traction roping path, sheaves, overspeed governor & buffers'}
            </p>
          </div>
        </div>

        {/* Suspension Type Selector Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 px-2">
            {isAr ? 'نظام التعليق:' : 'Suspension:'}
          </span>
          <button
            type="button"
            onClick={() => handleSelectSuspension('2:1_UNDERSLUNG')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              suspensionType === '2:1_UNDERSLUNG'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>2:1</span>
            <span>{isAr ? 'سفلي تحت الكابينة (Underslung)' : 'Underslung'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectSuspension('1:1_DIRECT')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              suspensionType === '1:1_DIRECT'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>1:1</span>
            <span>{isAr ? 'مباشر (Direct Roping)' : '1:1 Direct'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectSuspension('2:1_OVERSLUNG')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              suspensionType === '2:1_OVERSLUNG'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>2:1</span>
            <span>{isAr ? 'علوي فوق الكابينة (Overslung)' : 'Overslung'}</span>
          </button>
        </div>

        {/* View Tools: Zoom & Layers */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={isAr ? 'تصغير' : 'Zoom Out'}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 min-w-[38px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={isAr ? 'تكبير' : 'Zoom In'}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={isAr ? 'إعادة ضبط التكبير' : 'Reset Zoom'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SIMULATOR TRAVEL CONTROLS & COMPONENT TOGGLES                         */}
      {/* ===================================================================== */}
      <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Play / Pause Travel Motion Simulator */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 shadow-md animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
            }`}
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>{isAr ? 'إيقاف المحاكاة' : 'Pause Simulation'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isAr ? 'محاكاة حركة الحبال والكابينة' : 'Simulate Travel Motion'}</span>
              </>
            )}
          </button>

          {/* Travel Height Slider */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <span className="text-slate-400 text-[11px] font-bold">
              {isAr ? 'موقع الكابينة:' : 'Car Pos:'}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(carPositionPercent)}
              onChange={(e) => {
                setIsSimulating(false);
                setCarPositionPercent(Number(e.target.value));
              }}
              className="w-28 accent-blue-500 cursor-pointer"
            />
            <span className="font-mono text-blue-400 font-bold text-[11px]">
              {Math.round(carPositionPercent)}%
            </span>
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer hover:text-white select-none">
            <input
              type="checkbox"
              checked={showGovernorLoop}
              onChange={(e) => setShowGovernorLoop(e.target.checked)}
              className="rounded accent-blue-500"
            />
            <span>{isAr ? 'حبل منظم السرعة (Governor)' : 'Overspeed Governor'}</span>
          </label>
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer hover:text-white select-none">
            <input
              type="checkbox"
              checked={showTravelingCable}
              onChange={(e) => setShowTravelingCable(e.target.checked)}
              className="rounded accent-blue-500"
            />
            <span>{isAr ? 'الكابل المرن (Traveling Cable)' : 'Traveling Cable'}</span>
          </label>
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer hover:text-white select-none">
            <input
              type="checkbox"
              checked={showDimensions}
              onChange={(e) => setShowDimensions(e.target.checked)}
              className="rounded accent-blue-500"
            />
            <span>{isAr ? 'الأبعاد الهندسية' : 'CAD Dimensions'}</span>
          </label>
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer hover:text-white select-none">
            <input
              type="checkbox"
              checked={showComponentLabels}
              onChange={(e) => setShowComponentLabels(e.target.checked)}
              className="rounded accent-blue-500"
            />
            <span>{isAr ? 'المسميات الهندسية' : 'Labels'}</span>
          </label>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN CAD SVG CANVAS (HIGH RESOLUTION ENGINEERING SECTION DRAWING)    */}
      {/* ===================================================================== */}
      <div 
        dir="ltr" 
        className="relative bg-white flex-1 min-h-[580px] flex items-center justify-center p-4 overflow-hidden select-none"
      >
        <div 
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
          className="w-full max-w-4xl h-full flex items-center justify-center"
        >
          <svg
            viewBox="0 0 940 640"
            className="w-full h-auto max-h-[620px] drop-shadow-md rounded-lg"
            style={{ backgroundColor: '#ffffff', fontFamily: 'monospace, "Segoe UI", sans-serif' }}
          >
            <defs>
              {/* Engineering Blueprint Background Grid */}
              <pattern id="cad-section-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
              </pattern>
              <pattern id="cad-section-major" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#cad-section-grid)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" strokeWidth="1.2" />
              </pattern>

              {/* Concrete Hatching for Shaft Slabs */}
              <pattern id="cad-concrete-section" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="16" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="8" cy="8" r="0.9" fill="#64748b" />
              </pattern>

              {/* Arrow Markers for CAD Dimensions */}
              <marker id="cad-arrow-blue-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 8 2 L 2 5 L 8 8 z" fill="#0284c7" />
              </marker>
              <marker id="cad-arrow-blue-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 2 2 L 8 5 L 2 8 z" fill="#0284c7" />
              </marker>
              <marker id="cad-arrow-amber-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 8 2 L 2 5 L 8 8 z" fill="#d97706" />
              </marker>
              <marker id="cad-arrow-amber-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 2 2 L 8 5 L 2 8 z" fill="#d97706" />
              </marker>
              <marker id="cad-arrow-green-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 8 2 L 2 5 L 8 8 z" fill="#16a34a" />
              </marker>
              <marker id="cad-arrow-green-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 2 2 L 8 5 L 2 8 z" fill="#16a34a" />
              </marker>
            </defs>

            {/* Background Grid */}
            <rect width="940" height="640" fill="url(#cad-section-major)" />

            {/* Outer Sheet Border & Title Header */}
            <rect x="15" y="15" width="910" height="610" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x="20" y="20" width="900" height="600" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />

            {/* Sheet Title Bar */}
            <g transform="translate(35, 45)">
              <text x="0" y="0" fontSize="13" fontWeight="900" fill="#0f172a">
                {isAr ? 'نظام التعليق وحبال الجر ومقطع البئر الرأسي (VERTICAL SECTION & SUSPENSION CAD)' : 'CAD ELEVATION & SUSPENSION ROPING SYSTEM'}
              </text>
              <text x="0" y="15" fontSize="9.5" fontWeight="bold" fill="#64748b">
                CODE: EN 81-20/50 &bull; RATIO: {suspensionType === '1:1_DIRECT' ? '1:1 DIRECT' : suspensionType === '2:1_UNDERSLUNG' ? '2:1 UNDERSLUNG' : '2:1 OVERSLUNG'} &bull; ROPES: {ropeCount} &times; &Oslash;{ropeDiameterMm}mm &bull; CAR SPEED: {carSpeedMs} m/s
              </text>
            </g>

            {/* Top Right Spec Badge */}
            <g transform="translate(680, 30)">
              <rect width="230" height="42" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" rx="4" />
              <text x="10" y="16" fontSize="9.5" fontWeight="bold" fill="#0f172a">
                {spec.ropingRatio} Roping &bull; PMSM {calc.motorPowerKw} kW
              </text>
              <text x="10" y="30" fontSize="8.5" fill="#0284c7" fontWeight="bold">
                Motor RPM: {Math.round((ropeSpeedMs * 60) / (Math.PI * 0.4))} rpm &bull; {motorTorqueFactor}
              </text>
            </g>

            {/* =============================================================== */}
            {/* 1. STRUCTURAL SHAFT ENCLOSURE & CONCRETE SLABS                  */}
            {/* =============================================================== */}
            {/* Shaft Interior Space */}
            <rect 
              x={shaftLeft} 
              y={overheadCeilingY} 
              width={shaftWidth} 
              height={pitFloorY - overheadCeilingY} 
              fill="#ffffff" 
              stroke="#94a3b8" 
              strokeWidth="2" 
            />

            {/* Overhead Concrete Ceiling Slab */}
            <rect 
              x={shaftLeft - 30} 
              y={overheadCeilingY - 35} 
              width={shaftWidth + 60} 
              height="35" 
              fill="url(#cad-concrete-section)" 
              stroke="#475569" 
              strokeWidth="1.5" 
            />

            {/* Pit Concrete Foundation Slab */}
            <rect 
              x={shaftLeft - 30} 
              y={pitFloorY} 
              width={shaftWidth + 60} 
              height="45" 
              fill="url(#cad-concrete-section)" 
              stroke="#475569" 
              strokeWidth="1.5" 
            />

            {/* Left & Right Shaft Brick/Concrete Walls Hatching */}
            <rect x={shaftLeft - 30} y={overheadCeilingY} width="30" height={pitFloorY - overheadCeilingY} fill="url(#cad-concrete-section)" stroke="#64748b" strokeWidth="1" />
            <rect x={shaftRight} y={overheadCeilingY} width="30" height={pitFloorY - overheadCeilingY} fill="url(#cad-concrete-section)" stroke="#64748b" strokeWidth="1" />

            {/* =============================================================== */}
            {/* 2. VERTICAL GUIDE RAILS & WALL FIXING BRACKETS                  */}
            {/* =============================================================== */}
            {/* Car Guide Rails (Left X: carLeft - 5, Right X: carRight + 5) */}
            <line x1={carLeft - 5} y1={overheadCeilingY + 15} x2={carLeft - 5} y2={pitFloorY - 10} stroke="#d97706" strokeWidth="2.5" />
            <line x1={carRight + 5} y1={overheadCeilingY + 15} x2={carRight + 5} y2={pitFloorY - 10} stroke="#d97706" strokeWidth="2.5" />
            
            {/* CWT Guide Rails */}
            <line x1={cwtLeft - 5} y1={overheadCeilingY + 15} x2={cwtLeft - 5} y2={pitFloorY - 10} stroke="#475569" strokeWidth="2" />
            <line x1={cwtRight + 5} y1={overheadCeilingY + 15} x2={cwtRight + 5} y2={pitFloorY - 10} stroke="#475569" strokeWidth="2" />

            {/* Guide Rail Wall Mounting Brackets (Every ~80px) */}
            {[140, 220, 300, 380, 460, 540].map((bracketY) => (
              <g key={`bracket-${bracketY}`}>
                {/* Left Wall to Car Rail Bracket */}
                <line x1={shaftLeft} y1={bracketY} x2={carLeft - 5} y2={bracketY} stroke="#94a3b8" strokeWidth="1.5" />
                <rect x={carLeft - 8} y={bracketY - 3} width="6" height="6" fill="#475569" />
                {/* Right Wall to CWT Rail Bracket */}
                <line x1={cwtRight + 5} y1={bracketY} x2={shaftRight} y2={bracketY} stroke="#94a3b8" strokeWidth="1.5" />
                <rect x={cwtRight + 2} y={bracketY - 3} width="6" height="6" fill="#475569" />
              </g>
            ))}

            {/* =============================================================== */}
            {/* 3. FLOOR LANDING SILLS & ENTRANCE DOORS ON LEFT                 */}
            {/* =============================================================== */}
            {/* Top Landing (Floor N) */}
            <g transform="translate(140, 190)">
              <line x1="0" y1="0" x2="80" y2="0" stroke="#16a34a" strokeWidth="2" />
              <rect x="75" y="-85" width="6" height="85" fill="#16a34a" rx="1" />
              <text x="-10" y="4" fill="#16a34a" fontSize="9" fontWeight="bold" textAnchor="end">
                Top Landing (FL {spec.stops})
              </text>
            </g>

            {/* Intermediate Landing */}
            <g transform="translate(140, 320)">
              <line x1="0" y1="0" x2="80" y2="0" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 2" />
              <rect x="75" y="-85" width="6" height="85" fill="#64748b" rx="1" />
              <text x="-10" y="4" fill="#64748b" fontSize="8.5" textAnchor="end">
                Mid Floor (Stops)
              </text>
            </g>

            {/* Bottom Landing Level 1 (Datum ±0.00) */}
            <g transform="translate(140, 440)">
              <line x1="0" y1="0" x2="80" y2="0" stroke="#0284c7" strokeWidth="2" />
              <rect x="75" y="-85" width="6" height="85" fill="#0284c7" rx="1" />
              <text x="-10" y="4" fill="#0284c7" fontSize="9" fontWeight="bold" textAnchor="end">
                Ground Floor (±0.00)
              </text>
            </g>

            {/* =============================================================== */}
            {/* 4. TRACTION DRIVE MACHINE & OVERHEAD BEAMS                      */}
            {/* =============================================================== */}
            <g 
              id="traction-machine-assembly"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredComponent('MACHINE')}
              onMouseLeave={() => setHoveredComponent(null)}
            >
              {/* Machine Steel Bedplate Beam */}
              <rect x={tractionSheaveX - 50} y={overheadCeilingY + 8} width="220" height="12" fill="#1e293b" rx="2" />

              {/* PMSM Gearless Motor Housing */}
              <rect 
                x={tractionSheaveX - 45} 
                y={overheadCeilingY + 20} 
                width="90" 
                height="50" 
                fill="#2563eb" 
                stroke="#1d4ed8" 
                strokeWidth="2" 
                rx="4" 
              />
              <text x={tractionSheaveX} y={overheadCeilingY + 48} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                PMSM MOTOR
              </text>

              {/* Traction Drive Sheave (طارة الجر الرئيسية) */}
              <circle 
                cx={tractionSheaveX} 
                cy={tractionSheaveY} 
                r={tractionSheaveRadius} 
                fill="#ffffff" 
                stroke="#d97706" 
                strokeWidth="3.5" 
              />
              <circle cx={tractionSheaveX} cy={tractionSheaveY} r="8" fill="#475569" />
              {/* Traction Sheave Grooves pattern */}
              <circle cx={tractionSheaveX} cy={tractionSheaveY} r={tractionSheaveRadius - 4} fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />

              {/* Deflector / Diverter Sheave (طارة الانحراف والتوجيه) */}
              <circle 
                cx={deflectorSheaveX} 
                cy={deflectorSheaveY} 
                r={deflectorSheaveRadius} 
                fill="#ffffff" 
                stroke="#64748b" 
                strokeWidth="2.5" 
              />
              <circle cx={deflectorSheaveX} cy={deflectorSheaveY} r="5" fill="#475569" />

              {showComponentLabels && (
                <text x={tractionSheaveX - 2} y={overheadCeilingY + 14} fill="#0284c7" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                  Traction Sheave (&Oslash;400mm)
                </text>
              )}
            </g>

            {/* =============================================================== */}
            {/* 5. ELEVATOR CAR SLING, CABIN BOX & SAFETY GEAR                  */}
            {/* =============================================================== */}
            <g 
              id="elevator-car-assembly"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredComponent('CAR')}
              onMouseLeave={() => setHoveredComponent(null)}
            >
              {/* Sling Upper Crosshead Beam */}
              <rect x={carLeft - 4} y={carTopSlingY} width={carWidth + 8} height="12" fill="#334155" stroke="#1e293b" strokeWidth="1.5" rx="1" />
              
              {/* Sling Vertical Stiles */}
              <rect x={carLeft - 4} y={carTopSlingY + 12} width="8" height={carHeight} fill="#475569" stroke="#334155" strokeWidth="1" />
              <rect x={carRight - 4} y={carTopSlingY + 12} width="8" height={carHeight} fill="#475569" stroke="#334155" strokeWidth="1" />

              {/* Guide Shoes (Upper & Lower) */}
              <rect x={carLeft - 8} y={carTopSlingY + 2} width="5" height="12" fill="#d97706" rx="1" />
              <rect x={carRight + 3} y={carTopSlingY + 2} width="5" height="12" fill="#d97706" rx="1" />
              <rect x={carLeft - 8} y={currentCarFloorY + 2} width="5" height="12" fill="#d97706" rx="1" />
              <rect x={carRight + 3} y={currentCarFloorY + 2} width="5" height="12" fill="#d97706" rx="1" />

              {/* Sling Lower Safety Plank */}
              <rect x={carLeft - 4} y={currentCarFloorY + 12} width={carWidth + 8} height="14" fill="#334155" stroke="#1e293b" strokeWidth="1.5" rx="1" />

              {/* Progressive Safety Gear Blocks (فرامل الأمان الباراشوت EN 81-20) */}
              <rect x={carLeft - 6} y={currentCarFloorY + 26} width="16" height="10" fill="#dc2626" rx="2" />
              <rect x={carRight - 10} y={currentCarFloorY + 26} width="16" height="10" fill="#dc2626" rx="2" />

              {/* Cabin Enclosure Box */}
              <rect 
                x={carLeft + 8} 
                y={carTopSlingY + 12} 
                width={carWidth - 16} 
                height={carHeight} 
                fill="#f8fafc" 
                stroke="#0284c7" 
                strokeWidth="2" 
                rx="2" 
              />

              {/* Car Door Opening on Left */}
              <rect x={carLeft + 8} y={carTopSlingY + 14} width="8" height={carHeight - 4} fill="#38bdf8" />

              {/* Cabin Interior Elements */}
              <circle cx={carCenterX - 24} cy={carTopSlingY + 55} r="7" fill="#64748b" />
              <rect x={carCenterX - 30} y={carTopSlingY + 64} width="12" height="25" fill="#64748b" rx="2" />
              <circle cx={carCenterX + 24} cy={carTopSlingY + 55} r="7" fill="#64748b" />
              <rect x={carCenterX + 18} y={carTopSlingY + 64} width="12" height="25" fill="#64748b" rx="2" />

              {/* Cabin Specification Text */}
              <text x={carCenterX} y={carTopSlingY + 52} fill="#0f172a" fontSize="10" fontWeight="900" textAnchor="middle">
                CAR CABIN
              </text>
              <text x={carCenterX} y={carTopSlingY + 66} fill="#475569" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                {spec.cabinWidthMm} &times; {spec.cabinDepthMm} mm
              </text>
              <text x={carCenterX} y={carTopSlingY + 79} fill="#0284c7" fontSize="8" fontWeight="bold" textAnchor="middle">
                {spec.capacityKg} kg ({spec.personsCount} P) &bull; {carSpeedMs} m/s
              </text>

              {/* ------------------------------------------------------------- */}
              {/* SPECIFIC SUSPENSION GEAR ON CAR                               */}
              {/* ------------------------------------------------------------- */}
              {/* Case 1: 1:1 Direct - Dead-end Hitch with Damping Springs on Crosshead */}
              {suspensionType === '1:1_DIRECT' && (
                <g id="car-1-1-hitch">
                  {/* Wedge Socket / Hitch Anchor */}
                  <rect x={tractionSheaveX - 12} y={carTopSlingY - 14} width="24" height="14" fill="#d97706" rx="2" />
                  {/* Compression Equalizing Springs */}
                  {[-8, 0, 8].map((offset, i) => (
                    <line key={i} x1={tractionSheaveX + offset} y1={carTopSlingY} x2={tractionSheaveX + offset} y2={carTopSlingY - 12} stroke="#f59e0b" strokeWidth="2" />
                  ))}
                  {showComponentLabels && (
                    <text x={tractionSheaveX} y={carTopSlingY - 18} fill="#d97706" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                      Hitch Springs &amp; Sockets
                    </text>
                  )}
                </g>
              )}

              {/* Case 2: 2:1 Underslung - Two Diverter Pulleys Mounted Under Car Safety Plank */}
              {suspensionType === '2:1_UNDERSLUNG' && (
                <g id="car-underslung-pulleys">
                  {/* Left Under-Car Sheave */}
                  <circle cx={carPulleyLeftX} cy={carUnderPulleyY} r={carPulleyRadius} fill="#ffffff" stroke="#d97706" strokeWidth="2.5" />
                  <circle cx={carPulleyLeftX} cy={carUnderPulleyY} r="4" fill="#475569" />
                  {/* Right Under-Car Sheave */}
                  <circle cx={carPulleyRightX} cy={carUnderPulleyY} r={carPulleyRadius} fill="#ffffff" stroke="#d97706" strokeWidth="2.5" />
                  <circle cx={carPulleyRightX} cy={carUnderPulleyY} r="4" fill="#475569" />
                  {/* Pulley Guard Casing / Bracket */}
                  <rect x={carPulleyLeftX - 14} y={currentCarFloorY + 12} width={carPulleyRightX - carPulleyLeftX + 28} height="8" fill="#334155" />
                  {showComponentLabels && (
                    <text x={carCenterX} y={carUnderPulleyY + 22} fill="#d97706" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                      Under-Car Diverter Pulleys (2:1 Underslung)
                    </text>
                  )}
                </g>
              )}

              {/* Case 3: 2:1 Overslung - Twin Sheaves Mounted on Car Crosshead */}
              {suspensionType === '2:1_OVERSLUNG' && (
                <g id="car-overslung-pulleys">
                  <circle cx={carOverPulleyLeftX} cy={carOverPulleyY} r={carPulleyRadius} fill="#ffffff" stroke="#d97706" strokeWidth="2.5" />
                  <circle cx={carOverPulleyLeftX} cy={carOverPulleyY} r="4" fill="#475569" />
                  <circle cx={carOverPulleyRightX} cy={carOverPulleyY} r={carPulleyRadius} fill="#ffffff" stroke="#d97706" strokeWidth="2.5" />
                  <circle cx={carOverPulleyRightX} cy={carOverPulleyY} r="4" fill="#475569" />
                  {showComponentLabels && (
                    <text x={carCenterX} y={carOverPulleyY - 14} fill="#d97706" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                      Over-Car Crosshead Sheaves (2:1 Overslung)
                    </text>
                  )}
                </g>
              )}
            </g>

            {/* =============================================================== */}
            {/* 6. COUNTERWEIGHT ASSEMBLY & PULLEY                              */}
            {/* =============================================================== */}
            <g 
              id="cwt-assembly"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredComponent('CWT')}
              onMouseLeave={() => setHoveredComponent(null)}
            >
              {/* CWT Outer Structural Frame */}
              <rect x={cwtLeft} y={currentCwtTopY} width={cwtWidth} height={cwtHeight} fill="#334155" stroke="#1e293b" strokeWidth="1.5" rx="2" />
              
              {/* Cast Iron / Concrete Filler Sub-Weights */}
              {Array.from({ length: 6 }).map((_, i) => (
                <line 
                  key={i} 
                  x1={cwtLeft + 4} 
                  y1={currentCwtTopY + 20 + i * 18} 
                  x2={cwtRight - 4} 
                  y2={currentCwtTopY + 20 + i * 18} 
                  stroke="#94a3b8" 
                  strokeWidth="1.2" 
                />
              ))}

              {/* CWT Guide Shoes */}
              <rect x={cwtLeft - 5} y={currentCwtTopY + 2} width="4" height="10" fill="#475569" rx="1" />
              <rect x={cwtRight + 1} y={currentCwtTopY + 2} width="4" height="10" fill="#475569" rx="1" />
              <rect x={cwtLeft - 5} y={currentCwtTopY + cwtHeight - 12} width="4" height="10" fill="#475569" rx="1" />
              <rect x={cwtRight + 1} y={currentCwtTopY + cwtHeight - 12} width="4" height="10" fill="#475569" rx="1" />

              <text x={cwtCenterX} y={currentCwtTopY + 68} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                CWT
              </text>
              <text x={cwtCenterX} y={currentCwtTopY + 80} fill="#cbd5e1" fontSize="7" textAnchor="middle">
                {Math.round(spec.capacityKg * 0.45 + (spec.cabinWeightKg || 600))} kg
              </text>

              {/* CWT Top Pulley for 2:1 Roping OR Hitch for 1:1 */}
              {suspensionType === '1:1_DIRECT' ? (
                <g id="cwt-1-1-hitch">
                  <rect x={cwtCenterX - 10} y={currentCwtTopY - 12} width="20" height="12" fill="#d97706" rx="2" />
                  <line x1={cwtCenterX} y1={currentCwtTopY} x2={cwtCenterX} y2={currentCwtTopY - 12} stroke="#f59e0b" strokeWidth="2" />
                </g>
              ) : (
                <g id="cwt-2-1-pulley">
                  <circle cx={cwtPulleyX} cy={cwtPulleyY} r={cwtPulleyRadius} fill="#ffffff" stroke="#d97706" strokeWidth="2.2" />
                  <circle cx={cwtPulleyX} cy={cwtPulleyY} r="3.5" fill="#475569" />
                  {showComponentLabels && (
                    <text x={cwtCenterX} y={cwtPulleyY - 12} fill="#d97706" fontSize="7" fontWeight="bold" textAnchor="middle">
                      CWT Pulley
                    </text>
                  )}
                </g>
              )}
            </g>

            {/* =============================================================== */}
            {/* 7. SUSPENSION STEEL WIRE ROPES (TRUE GEOMETRY PATHS)            */}
            {/* =============================================================== */}
            <g id="suspension-wire-ropes">
              {/* SCHEME A: 1:1 DIRECT ROPING */}
              {suspensionType === '1:1_DIRECT' && (
                <>
                  {/* Rope from Car Hitch up to Traction Sheave */}
                  <line 
                    x1={tractionSheaveX} 
                    y1={carTopSlingY - 14} 
                    x2={tractionSheaveX} 
                    y2={tractionSheaveY} 
                    stroke="#f59e0b" 
                    strokeWidth="2.5" 
                  />
                  {/* Arc over Traction Sheave to Deflector */}
                  <path 
                    d={`M ${tractionSheaveX} ${tractionSheaveY} A ${tractionSheaveRadius} ${tractionSheaveRadius} 0 0 1 ${deflectorSheaveX} ${deflectorSheaveY}`} 
                    fill="none" 
                    stroke="#f59e0b" 
                    strokeWidth="2.5" 
                  />
                  {/* Rope from Deflector straight down to CWT Hitch */}
                  <line 
                    x1={deflectorSheaveX} 
                    y1={deflectorSheaveY} 
                    x2={cwtCenterX} 
                    y2={currentCwtTopY - 12} 
                    stroke="#f59e0b" 
                    strokeWidth="2.5" 
                  />
                </>
              )}

              {/* SCHEME B: 2:1 UNDERSLUNG ROPING */}
              {suspensionType === '2:1_UNDERSLUNG' && (
                <>
                  {/* 1. Overhead Dead-End Hitch 1 on Car Side */}
                  <rect x={carOverheadHitchX - 10} y={carOverheadHitchY} width="20" height="10" fill="#d97706" rx="2" />
                  <line x1={carOverheadHitchX} y1={overheadCeilingY} x2={carOverheadHitchX} y2={carOverheadHitchY + 10} stroke="#f59e0b" strokeWidth="2" />
                  
                  {/* 2. Rope drops from Overhead Hitch 1 down to Left Under-Car Pulley */}
                  <line 
                    x1={carOverheadHitchX} 
                    y1={carOverheadHitchY + 10} 
                    x2={carPulleyLeftX - carPulleyRadius} 
                    y2={carUnderPulleyY} 
                    stroke="#f59e0b" 
                    strokeWidth="2.5" 
                  />

                  {/* 3. Rope wraps under Left Pulley, runs horizontally under car, and wraps under Right Pulley */}
                  <path 
                    d={`
                      M ${carPulleyLeftX - carPulleyRadius} ${carUnderPulleyY}
                      A ${carPulleyRadius} ${carPulleyRadius} 0 0 0 ${carPulleyLeftX} ${carUnderPulleyY + carPulleyRadius}
                      L ${carPulleyRightX} ${carUnderPulleyY + carPulleyRadius}
                      A ${carPulleyRadius} ${carPulleyRadius} 0 0 0 ${carPulleyRightX + carPulleyRadius} ${carUnderPulleyY}
                    `}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />

                  {/* 4. Rope rises from Right Under-Car Pulley up to Traction Sheave */}
                  <line 
                    x1={carPulleyRightX + carPulleyRadius} 
                    y1={carUnderPulleyY} 
                    x2={tractionSheaveX} 
                    y2={tractionSheaveY} 
                    stroke="#f59e0b" 
                    strokeWidth="2.5" 
                  />

                  {/* 5. Rope wraps over Traction Sheave to Deflector Sheave */}
                  <path 
                    d={`M ${tractionSheaveX} ${tractionSheaveY} A ${tractionSheaveRadius} ${tractionSheaveRadius} 0 0 1 ${deflectorSheaveX} ${deflectorSheaveY}`} 
                    fill="none" 
                    stroke="#f59e0b" 
                    strokeWidth="2.5" 
                  />

                  {/* 6. Rope drops from Deflector Sheave down around CWT Pulley */}
                  <path 
                    d={`
                      M ${deflectorSheaveX} ${deflectorSheaveY}
                      L ${cwtPulleyX - cwtPulleyRadius} ${cwtPulleyY}
                      A ${cwtPulleyRadius} ${cwtPulleyRadius} 0 0 0 ${cwtPulleyX + cwtPulleyRadius} ${cwtPulleyY}
                      L ${cwtOverheadHitchX} ${cwtOverheadHitchY + 10}
                    `}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />

                  {/* 7. Overhead Dead-End Hitch 2 on CWT Side */}
                  <rect x={cwtOverheadHitchX - 10} y={cwtOverheadHitchY} width="20" height="10" fill="#d97706" rx="2" />
                  <line x1={cwtOverheadHitchX} y1={overheadCeilingY} x2={cwtOverheadHitchX} y2={cwtOverheadHitchY + 10} stroke="#f59e0b" strokeWidth="2" />
                </>
              )}

              {/* SCHEME C: 2:1 OVERSLUNG ROPING */}
              {suspensionType === '2:1_OVERSLUNG' && (
                <>
                  {/* Fixed Overhead Hitch Car Side */}
                  <rect x={carOverheadHitchX - 10} y={carOverheadHitchY} width="20" height="10" fill="#d97706" rx="2" />
                  <line 
                    x1={carOverheadHitchX} 
                    y1={carOverheadHitchY + 10} 
                    x2={carOverPulleyLeftX - carPulleyRadius} 
                    y2={carOverPulleyY} 
                    stroke="#f59e0b" 
                    strokeWidth="2.5" 
                  />
                  {/* Around Over-car twin sheaves */}
                  <path 
                    d={`
                      M ${carOverPulleyLeftX - carPulleyRadius} ${carOverPulleyY}
                      A ${carPulleyRadius} ${carPulleyRadius} 0 0 0 ${carOverPulleyLeftX} ${carOverPulleyY + carPulleyRadius}
                      L ${carOverPulleyRightX} ${carOverPulleyY + carPulleyRadius}
                      A ${carPulleyRadius} ${carPulleyRadius} 0 0 0 ${carOverPulleyRightX + carPulleyRadius} ${carOverPulleyY}
                      L ${tractionSheaveX} ${tractionSheaveY}
                    `}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />
                  {/* Traction to Deflector to CWT to Top Hitch */}
                  <path 
                    d={`M ${tractionSheaveX} ${tractionSheaveY} A ${tractionSheaveRadius} ${tractionSheaveRadius} 0 0 1 ${deflectorSheaveX} ${deflectorSheaveY}`} 
                    fill="none" 
                    stroke="#f59e0b" 
                    strokeWidth="2.5" 
                  />
                  <path 
                    d={`
                      M ${deflectorSheaveX} ${deflectorSheaveY}
                      L ${cwtPulleyX - cwtPulleyRadius} ${cwtPulleyY}
                      A ${cwtPulleyRadius} ${cwtPulleyRadius} 0 0 0 ${cwtPulleyX + cwtPulleyRadius} ${cwtPulleyY}
                      L ${cwtOverheadHitchX} ${cwtOverheadHitchY + 10}
                    `}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />
                  <rect x={cwtOverheadHitchX - 10} y={cwtOverheadHitchY} width="20" height="10" fill="#d97706" rx="2" />
                </>
              )}
            </g>

            {/* =============================================================== */}
            {/* 8. SPEED GOVERNOR CLOSED LOOP & PIT TENSION PULLEY              */}
            {/* =============================================================== */}
            {showGovernorLoop && (
              <g id="governor-loop">
                {/* Overhead Governor Unit */}
                <circle cx={govSheaveX} cy={govSheaveY} r="10" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                <circle cx={govSheaveX} cy={govSheaveY} r="3" fill="#ef4444" />
                <rect x={govSheaveX - 14} y={overheadCeilingY} width="28" height="6" fill="#1e293b" />

                {/* Pit Tensioning Sheave with Weighted Lever Arm */}
                <circle cx={pitGovSheaveX} cy={pitGovSheaveY} r="10" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                <circle cx={pitGovSheaveX} cy={pitGovSheaveY} r="3" fill="#ef4444" />
                {/* Tension Weight Block in Pit */}
                <rect x={pitGovSheaveX + 12} y={pitGovSheaveY - 4} width="16" height="10" fill="#b91c1c" rx="1" />
                <line x1={pitGovSheaveX} y1={pitGovSheaveY} x2={pitGovSheaveX + 12} y2={pitGovSheaveY} stroke="#1e293b" strokeWidth="2" />

                {/* Left Wire Run (Downward straight line) */}
                <line x1={govSheaveX - 10} y1={govSheaveY} x2={pitGovSheaveX - 10} y2={pitGovSheaveY} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 1" />

                {/* Right Wire Run (Passes through Car Safety Gear lever) */}
                <line x1={govSheaveX + 10} y1={govSheaveY} x2={govSheaveX + 10} y2={currentCarFloorY + 28} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 1" />
                <line x1={govSheaveX + 10} y1={currentCarFloorY + 28} x2={pitGovSheaveX + 10} y2={pitGovSheaveY} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 1" />

                {/* Safety Gear Trip Mechanical Lever connected to Car */}
                <line x1={govSheaveX + 10} y1={currentCarFloorY + 28} x2={carLeft - 6} y2={currentCarFloorY + 28} stroke="#ef4444" strokeWidth="2" />
                <circle cx={govSheaveX + 10} cy={currentCarFloorY + 28} r="3" fill="#dc2626" />

                {showComponentLabels && (
                  <text x={govSheaveX} y={govSheaveY + 22} fill="#dc2626" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                    Overspeed Governor
                  </text>
                )}
              </g>
            )}

            {/* =============================================================== */}
            {/* 9. TRAVELING CABLE LOOP                                         */}
            {/* =============================================================== */}
            {showTravelingCable && (
              <g id="traveling-cable">
                {/* Wall Mid-Shaft Junction Box */}
                <rect x={cableWallAnchorX} y={cableWallAnchorY - 8} width="10" height="16" fill="#0284c7" rx="1" />
                
                {/* Car Underside Connection Box */}
                <rect x={cableCarAnchorX - 4} y={cableCarAnchorY} width="12" height="8" fill="#0284c7" rx="1" />

                {/* Parabolic Hanging Loop Path */}
                <path
                  d={`
                    M ${cableWallAnchorX + 10} ${cableWallAnchorY}
                    C ${cableWallAnchorX + 15} ${cableLoopBottomY},
                      ${cableCarAnchorX} ${cableLoopBottomY},
                      ${cableCarAnchorX} ${cableCarAnchorY + 8}
                  `}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {showComponentLabels && (
                  <text x={cableWallAnchorX + 45} y={cableLoopBottomY - 8} fill="#0284c7" fontSize="7.5" fontWeight="bold">
                    Traveling Cable
                  </text>
                )}
              </g>
            )}

            {/* =============================================================== */}
            {/* 10. PIT BUFFERS & ACCESSIBILITY LADDER                          */}
            {/* =============================================================== */}
            <g id="pit-equipment">
              {/* Car Oil/Polyurethane Buffers (2 Units under car safety plank) */}
              <g transform={`translate(${carLeft + 30}, ${pitFloorY - 45})`}>
                <rect x="0" y="20" width="26" height="25" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" rx="2" />
                <path d="M 13 0 L 13 20 M 5 7 L 21 7 M 5 14 L 21 14" stroke="#d97706" strokeWidth="2.5" />
                <rect x="-4" y="42" width="34" height="3" fill="#475569" />
              </g>

              <g transform={`translate(${carRight - 56}, ${pitFloorY - 45})`}>
                <rect x="0" y="20" width="26" height="25" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" rx="2" />
                <path d="M 13 0 L 13 20 M 5 7 L 21 7 M 5 14 L 21 14" stroke="#d97706" strokeWidth="2.5" />
                <rect x="-4" y="42" width="34" height="3" fill="#475569" />
              </g>

              {/* Counterweight Buffer */}
              <g transform={`translate(${cwtCenterX - 13}, ${pitFloorY - 45})`}>
                <rect x="0" y="20" width="26" height="25" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" rx="2" />
                <path d="M 13 0 L 13 20 M 5 7 L 21 7 M 5 14 L 21 14" stroke="#d97706" strokeWidth="2.5" />
                <rect x="-4" y="42" width="34" height="3" fill="#475569" />
              </g>

              {/* Pit Access Safety Ladder with rungs */}
              <line x1={shaftLeft + 12} y1={pitFloorY - 120} x2={shaftLeft + 12} y2={pitFloorY} stroke="#94a3b8" strokeWidth="2" />
              <line x1={shaftLeft + 24} y1={pitFloorY - 120} x2={shaftLeft + 24} y2={pitFloorY} stroke="#94a3b8" strokeWidth="2" />
              {Array.from({ length: 7 }).map((_, i) => (
                <line key={i} x1={shaftLeft + 12} y1={pitFloorY - 110 + i * 16} x2={shaftLeft + 24} y2={pitFloorY - 110 + i * 16} stroke="#94a3b8" strokeWidth="1.5" />
              ))}

              {showComponentLabels && (
                <text x={carCenterX} y={pitFloorY - 6} fill="#d97706" fontSize="8" fontWeight="bold" textAnchor="middle">
                  Energy Accumulation / Oil Buffers (EN 81-20)
                </text>
              )}
            </g>

            {/* =============================================================== */}
            {/* 11. VERTICAL DIMENSIONS & SAFETY CLEARANCES (EN 81-20)          */}
            {/* =============================================================== */}
            {showDimensions && (
              <g id="vertical-dimensions">
                {/* 1. Overhead Height (OH) Dimension Line */}
                <line 
                  x1={shaftRight + 25} 
                  y1={overheadCeilingY} 
                  x2={shaftRight + 25} 
                  y2={190} 
                  stroke="#0284c7" 
                  strokeWidth="1.5" 
                  markerStart="url(#cad-arrow-blue-start)" 
                  markerEnd="url(#cad-arrow-blue-end)" 
                />
                <line x1={shaftRight} y1={overheadCeilingY} x2={shaftRight + 32} y2={overheadCeilingY} stroke="#0284c7" strokeWidth="0.8" strokeDasharray="2 2" />
                <line x1={shaftRight} y1={190} x2={shaftRight + 32} y2={190} stroke="#0284c7" strokeWidth="0.8" strokeDasharray="2 2" />
                <rect x={shaftRight + 36} y="125" width="180" height="22" fill="#0284c7" rx="3" />
                <text x={shaftRight + 44} y="140" fill="#ffffff" fontSize="9.5" fontWeight="bold">
                  OH: {spec.overheadHeightMm} mm
                </text>

                {/* 2. Travel Height (TH) Dimension Line */}
                <line 
                  x1={shaftRight + 25} 
                  y1={190} 
                  x2={shaftRight + 25} 
                  y2={440} 
                  stroke="#16a34a" 
                  strokeWidth="1.5" 
                  markerStart="url(#cad-arrow-green-start)" 
                  markerEnd="url(#cad-arrow-green-end)" 
                />
                <line x1={shaftRight} y1={440} x2={shaftRight + 32} y2={440} stroke="#16a34a" strokeWidth="0.8" strokeDasharray="2 2" />
                <rect x={shaftRight + 36} y="300" width="180" height="22" fill="#16a34a" rx="3" />
                <text x={shaftRight + 44} y="315" fill="#ffffff" fontSize="9.5" fontWeight="bold">
                  TRAVEL: {spec.travelHeightM} m ({spec.stops} Stops)
                </text>

                {/* 3. Pit Depth (PD) Dimension Line */}
                <line 
                  x1={shaftRight + 25} 
                  y1={440} 
                  x2={shaftRight + 25} 
                  y2={pitFloorY} 
                  stroke="#d97706" 
                  strokeWidth="1.5" 
                  markerStart="url(#cad-arrow-amber-start)" 
                  markerEnd="url(#cad-arrow-amber-end)" 
                />
                <line x1={shaftRight} y1={pitFloorY} x2={shaftRight + 32} y2={pitFloorY} stroke="#d97706" strokeWidth="0.8" strokeDasharray="2 2" />
                <rect x={shaftRight + 36} y="495" width="180" height="22" fill="#d97706" rx="3" />
                <text x={shaftRight + 44} y="510" fill="#ffffff" fontSize="9.5" fontWeight="bold">
                  PIT: {spec.pitDepthMm} mm
                </text>
              </g>
            )}

            {/* Bottom Compliance Engineering Signature */}
            <g transform="translate(35, 615)">
              <text x="0" y="0" fontSize="8.5" fill="#64748b">
                TWINS ELEVATORS CAD SYSTEM &bull; DESIGN COMPLIANT WITH SASO &amp; EN 81-20:2020 SAFETY RULES &bull; SAFETY FACTOR &ge; 12
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FOOTER ENGINEERING SPECIFICATIONS & ROPING CALCULATIONS              */}
      {/* ===================================================================== */}
      <div className="bg-slate-950 p-4 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {/* Spec 1: Roping Ratio & Speed */}
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400">
            {isAr ? 'نسبة وسرعة التعليق' : 'Roping & Speed'}
          </div>
          <div className="text-base font-black text-blue-400 mt-1">
            {spec.ropingRatio} Roping
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isAr ? `سرعة الكابينة: ${carSpeedMs} م/ث &bull; سرعة الحبال: ${ropeSpeedMs} م/ث` : `Car: ${carSpeedMs} m/s &bull; Rope: ${ropeSpeedMs} m/s`}
          </div>
        </div>

        {/* Spec 2: Steel Wire Ropes */}
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400">
            {isAr ? 'مواصفات حبال الجر' : 'Traction Wire Ropes'}
          </div>
          <div className="text-base font-black text-amber-400 mt-1">
            {ropeCount} &times; &Oslash;{ropeDiameterMm} mm
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isAr ? 'فولاذ مجدول 8x19S &bull; معامل أمان SF ≥ 14' : 'Steel Warrington-Seale &bull; SF ≥ 14'}
          </div>
        </div>

        {/* Spec 3: Sheave Diameters (D/d rule) */}
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400">
            {isAr ? 'أقطار الطارات ومعيار D/d' : 'Sheave Ratio (D/d)'}
          </div>
          <div className="text-base font-black text-emerald-400 mt-1">
            D/d = 40 (مطابق EN 81-20)
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isAr ? 'طارة الجر: 400 مم &bull; طارة الانحراف: 320 مم' : 'Drive: 400mm &bull; Diverter: 320mm'}
          </div>
        </div>

        {/* Spec 4: Motor & Energy Efficiency */}
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400">
            {isAr ? 'كفاءة المحرك والعزم' : 'Motor & Torque Efficiency'}
          </div>
          <div className="text-base font-black text-purple-400 mt-1">
            {calc.motorPowerKw} kW PMSM
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {suspensionType === '1:1_DIRECT' 
              ? (isAr ? 'عزم مباشر عالي 100%' : 'Direct torque 100%') 
              : (isAr ? 'عزم مخفض 50% مع ماكينة مدمجة' : '50% torque reduction, compact MRL')}
          </div>
        </div>
      </div>
    </div>
  );
};

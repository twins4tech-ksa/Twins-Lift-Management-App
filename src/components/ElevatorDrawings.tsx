import React, { useState, useRef, useEffect } from 'react';
import { ElevatorSpecification, ShaftCalculations } from '../types/elevator';
import { CompanySettings } from '../types/settings';
import { calculateElevatorEngineering } from '../utils/elevatorCalculations';
import { 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Printer, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  Layers,
  FileSpreadsheet,
  Sliders,
  Move,
  Check,
  Edit3,
  X,
  Info
} from 'lucide-react';
import { SuspensionElevationCAD } from './SuspensionElevationCAD';

interface Props {
  settings?: CompanySettings;
  onUpdateSettings?: (newSettings: CompanySettings) => void;
  spec: ElevatorSpecification;
  onUpdateSpec?: (updated: Partial<ElevatorSpecification>) => void;
  onNavigateToBOM?: () => void;
  onNavigateToPrint?: () => void;
}

type DrawingViewMode = 'PLAN_VIEW' | 'SECTION_VIEW' | 'SUSPENSION_VIEW' | 'CABIN_INTERIOR';

export const ElevatorDrawings: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  spec,
  onUpdateSpec,
  onNavigateToPrint
}) => {
  const [viewMode, setViewMode] = useState<DrawingViewMode>('PLAN_VIEW');
  const [showDimensions, setShowDimensions] = useState(true);
  const [showClearances, setShowClearances] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Margin adjustment drawer and active offsets in mm
  const isSideDoorType = spec.doorType?.toUpperCase().includes('SIDE');
  const calculatedDefaultSill = isSideDoorType ? 150 : 100;
  const [showMarginSettings, setShowMarginSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [frontSillMargin, setFrontSillMargin] = useState<number>(spec.cabinFrontSillOffsetMm ?? calculatedDefaultSill);
  const [sideMarginOffset, setSideMarginOffset] = useState<number>(spec.cabinSideOffsetMm ?? 0);
  const [rearMarginOffset, setRearMarginOffset] = useState<number>(spec.cabinRearOffsetMm ?? 0);

  // Interactive Double-Click Dimension Editor state
  type EditableField = 'SW' | 'SD' | 'CW' | 'CD' | 'DW' | 'OH' | 'PD' | 'TRAVEL' | 'CWT_WIDTH' | 'CWT_DEPTH' | 'CWT_REAR_GAP' | 'CAR_CWT_GAP' | 'SILL_GAP' | 'LEFT_MARGIN' | 'RIGHT_MARGIN';
  const [editingField, setEditingField] = useState<{
    field: EditableField;
    labelAr: string;
    labelEn: string;
    currentValue: number;
    unit: string;
  } | null>(null);
  const [editInputValue, setEditInputValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (successNotice) {
      const timer = setTimeout(() => setSuccessNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successNotice]);

  useEffect(() => {
    if (spec.cabinFrontSillOffsetMm !== undefined && spec.cabinFrontSillOffsetMm !== null) {
      setFrontSillMargin(spec.cabinFrontSillOffsetMm);
    } else {
      setFrontSillMargin(spec.doorType?.toUpperCase().includes('SIDE') ? 150 : 100);
    }
    if (spec.cabinSideOffsetMm !== undefined) setSideMarginOffset(spec.cabinSideOffsetMm);
    if (spec.cabinRearOffsetMm !== undefined) setRearMarginOffset(spec.cabinRearOffsetMm);
  }, [spec.cabinFrontSillOffsetMm, spec.doorType, spec.cabinSideOffsetMm, spec.cabinRearOffsetMm]);

  const handleApplyMargins = (front: number, side: number, rear: number) => {
    setFrontSillMargin(front);
    setSideMarginOffset(side);
    setRearMarginOffset(rear);
    onUpdateSpec?.({
      cabinFrontSillOffsetMm: front,
      cabinSideOffsetMm: side,
      cabinRearOffsetMm: rear
    });
  };

  const handleResetToStandardMargins = () => {
    const defaultSill = spec.doorType?.toUpperCase().includes('SIDE') ? 150 : 100;
    handleApplyMargins(defaultSill, 0, 0);
  };

  const calc: ShaftCalculations = calculateElevatorEngineering(spec);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 2.2));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.6));
  const handleResetZoom = () => setZoomLevel(1);

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${spec.quoteRef || 'ELEV'}_${viewMode}_Drawing.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintDrawing = () => {
    if (onNavigateToPrint) {
      onNavigateToPrint();
    } else {
      window.print();
    }
  };

  // Dimensions
  const SW = spec.shaftWidthMm;
  const SD = spec.shaftDepthMm;
  const CW = spec.cabinWidthMm;
  const CD = spec.cabinDepthMm;
  const DW = spec.doorWidthMm;
  const OH = spec.overheadHeightMm;
  
  // Drawing Config from Settings
  const defaultCwtDepthMm = settings?.drawingSettings?.cwtDepthMm || 250;
  const defaultCwtWidthMm = settings?.drawingSettings?.cwtWidthMm || 800;
  const defaultCwtToRearGapMm = settings?.drawingSettings?.cwtToRearGapMm ?? 70;
  const defaultCarToCwtGapMm = settings?.drawingSettings?.carToCwtGapMm ?? 150;
  const defaultFrontSillGapMm = spec.cabinFrontSillOffsetMm ?? calculatedDefaultSill;
  const PD = spec.pitDepthMm;
  const Travel = spec.travelHeightM * 1000;

  // Plan View Scaling coordinates inside SVG viewBox 0 0 900 650
  const planScale = Math.min(500 / Math.max(SW, 1500), 400 / Math.max(SD, 1500));
  const shaftSvgW = SW * planScale;
  const shaftSvgH = SD * planScale;
  const shaftX = (850 - shaftSvgW) / 2;
  const shaftY = 80 + (460 - shaftSvgH) / 2;

  // Cabin dimensions in SVG units
  const carSvgW = CW * planScale;
  const carSvgH = CD * planScale;

  // 1. Cabin Vertical Margin and Placement:
  // Front landing sill is anchored at shaft bottom (shaftY + shaftSvgH).
  // Front running sill clearance is frontSillMargin (100mm for CENTER, 150mm for SIDE).
  // Cabin front edge = shaftY + shaftSvgH - (frontSillMargin * planScale).
  // Cabin top (rear) edge = cabin front edge - carSvgH + (rearMarginOffset * planScale).
  const frontSillOffset = frontSillMargin * planScale;
  const carFrontY = shaftY + shaftSvgH - frontSillOffset;
  const carSvgY = carFrontY - carSvgH + (rearMarginOffset * planScale);

  // 2. Counterweight Dimensions & Safe Clearance Positioning:
  const cwtPosition = spec.counterweightPosition || 'REAR';
  const isSideCwt = cwtPosition === 'SIDE_LEFT' || cwtPosition === 'SIDE_RIGHT';

  const availableRearSpaceMm = SD - CD - frontSillMargin;
  const safeCwtDepthMm = spec.counterweightDepthMm ?? defaultCwtDepthMm;
  const safeCwtWidthMm = spec.counterweightWidthMm ?? defaultCwtWidthMm;

  // In Plan View:
  // When REAR: horizontal frame (width along X = safeCwtWidthMm, depth along Y = safeCwtDepthMm).
  // When SIDE (SIDE_LEFT or SIDE_RIGHT): vertical frame parallel to hoistway depth (SD):
  //   - width along X (thickness) = safeCwtDepthMm * planScale
  //   - height along Y (length parallel to hoistway depth) = safeCwtWidthMm * planScale
  const cwtSvgW = (isSideCwt ? safeCwtDepthMm : safeCwtWidthMm) * planScale;
  const cwtSvgH = (isSideCwt ? safeCwtWidthMm : safeCwtDepthMm) * planScale;

  let cwtX = shaftX;
  let cwtY = shaftY;

  if (cwtPosition === 'REAR') {
    cwtX = shaftX + (shaftSvgW - cwtSvgW) / 2;
    // Default 70mm gap from rear wall
    cwtY = shaftY + defaultCwtToRearGapMm * planScale;
  } else if (cwtPosition === 'SIDE_LEFT') {
    // Oriented vertically parallel to left hoistway wall with 30mm safety clearance
    cwtX = shaftX + 30 * planScale;
    cwtY = shaftY + (shaftSvgH - cwtSvgH) / 2;
  } else {
    // SIDE_RIGHT: Oriented vertically parallel to right hoistway wall with 30mm safety clearance
    cwtX = shaftX + shaftSvgW - cwtSvgW - 30 * planScale;
    cwtY = shaftY + (shaftSvgH - cwtSvgH) / 2;
  }

  // 3. Cabin Horizontal Margin and Placement:
  // Automatically ensure clearance from side counterweight if applicable
  let baseCarSvgX = shaftX + (shaftSvgW - carSvgW) / 2;
  const minCwtCarGap = 50 * planScale; // EN 81-20 standard: minimum 50mm clearance between car and counterweight

  if (cwtPosition === 'SIDE_LEFT') {
    const minSafeCarX = cwtX + cwtSvgW + minCwtCarGap;
    if (baseCarSvgX < minSafeCarX) {
      baseCarSvgX = minSafeCarX;
    }
  } else if (cwtPosition === 'SIDE_RIGHT') {
    const maxSafeCarX = cwtX - minCwtCarGap - carSvgW;
    if (baseCarSvgX > maxSafeCarX) {
      baseCarSvgX = maxSafeCarX;
    }
  }

  // Apply user custom horizontal offset
  const carSvgX = baseCarSvgX + (sideMarginOffset * planScale);

  // 4. Door aligned with cabin center
  const doorSvgW = DW * planScale;
  const doorSvgX = carSvgX + (carSvgW - doorSvgW) / 2;

  // Door Operator (جهاز الباب) dimensions:
  // User Specification:
  // Center Opening (سنتر): DW 1.00m (1000mm) requires 2.10m (2100mm) -> multiplier = 2.1 * DW (extra 1.1 * DW = 55% each side)
  // Side Opening (جانبي): DW 1.00m (1000mm) requires 1.05m (1050mm) -> multiplier = 1.05 * DW (extra 0.05 * DW = 5cm on 1m)
  const isCenterDoor = spec.doorType === 'CENTER_2P' || spec.doorType === 'CENTER_4P';
  const doorOperatorWidthMm = Math.round(isCenterDoor ? DW * 2.1 : DW * 1.05);
  const doorOperatorSvgW = doorOperatorWidthMm * planScale;
  const doorOperatorSvgX = isCenterDoor
    ? doorSvgX - ((doorOperatorSvgW - doorSvgW) / 2) // Centered symmetrically over door
    : doorSvgX; // Extends along the side opening direction

  // Validation function: ensures elements do not exceed shaft and maintain >= 30mm clearance from all walls
  const validateDimensionChange = (field: EditableField, value: number): string | null => {
    if (isNaN(value) || value <= 0) {
      return 'القيمة يجب أن تكون رقم موجب أكبر من الصفر (Value must be a positive number)';
    }

    const MIN_WALL_CLEARANCE = 30; // 30 مم قبل الحائط من جميع الجوانب

    if (field === 'SW') {
      // Shaft Width must accommodate cabin, counterweight (if side, thickness is safeCwtDepthMm), and at least 30mm on both sides
      const minRequiredWidth = cwtPosition === 'REAR'
        ? CW + (MIN_WALL_CLEARANCE * 2)
        : CW + safeCwtDepthMm + (MIN_WALL_CLEARANCE * 2) + 50;
      if (value < minRequiredWidth) {
        return `عرض البئر ${value} مم صغير جداً. يجب أن يكون على الأقل ${minRequiredWidth} مم (الكابينة ${CW} مم + خلوص أمان 30 مم وسماكة الثقل الجانبي ${safeCwtDepthMm} مم).`;
      }
      // Check door operator against shaft width
      if (doorOperatorWidthMm > value - (MIN_WALL_CLEARANCE * 2)) {
        return `عرض البئر ${value} مم لا يكفي لجهاز الباب (${doorOperatorWidthMm} مم) مع خلوص 30 مم من الجدران.`;
      }
    }

    if (field === 'SD') {
      // Shaft Depth must accommodate cabin, counterweight (if rear, thickness safeCwtDepthMm; if side, length safeCwtWidthMm), front sill gap, and clearances
      const minRequiredDepth = cwtPosition === 'REAR'
        ? CD + safeCwtDepthMm + defaultCwtToRearGapMm + frontSillMargin + MIN_WALL_CLEARANCE
        : Math.max(CD + frontSillMargin + MIN_WALL_CLEARANCE, safeCwtWidthMm + (MIN_WALL_CLEARANCE * 2));
      if (value < minRequiredDepth) {
        return `عمق البئر ${value} مم صغير جداً. يجب أن يكون على الأقل ${minRequiredDepth} مم (الكابينة ${CD} مم + الأثقال والخلوصات).`;
      }
    }

    if (field === 'CW') {
      // Cabin Width: cannot exceed shaft width or violate 30mm clearance
      const maxAllowedCW = cwtPosition === 'REAR'
        ? SW - (MIN_WALL_CLEARANCE * 2)
        : SW - safeCwtDepthMm - (MIN_WALL_CLEARANCE * 2) - 50;
      if (value > maxAllowedCW) {
        return `عرض الكابينة ${value} مم كبير جداً! لا يمكن أن يتعدى مساحة البئر ويجب ترك خلوص 30 مم وسماكة الثقل ${safeCwtDepthMm} مم (الحد الأقصى المتاح ${maxAllowedCW} مم).`;
      }
      if (value < DW) {
        return `عرض الكابينة ${value} مم لا يمكن أن يكون أصغر من فتحة الباب (${DW} مم).`;
      }
    }

    if (field === 'CD') {
      // Cabin Depth: cannot exceed shaft depth or violate 30mm clearance
      const maxAllowedCD = cwtPosition === 'REAR'
        ? SD - defaultCwtDepthMm - defaultCwtToRearGapMm - frontSillMargin - MIN_WALL_CLEARANCE
        : SD - frontSillMargin - MIN_WALL_CLEARANCE;
      if (value > maxAllowedCD) {
        return `عمق الكابينة ${value} مم كبير جداً! لا يمكن أن يتعدى مساحة البئر ويجب ترك مسافة 30 مم على الأقل قبل الحائط (الحد الأقصى المتاح ${maxAllowedCD} مم).`;
      }
    }

    if (field === 'DW') {
      // Door Width: check operator width & boundary collisions
      // Center door: 1m needs 2.10m (2.1x). Side door: 1m needs 1.05m (1.05x).
      const operatorW = Math.round(isCenterDoor ? value * 2.1 : value * 1.05);
      if (value > CW) {
        return `عرض فتحة الباب ${value} مم أكبر من عرض الكابينة (${CW} مم)!`;
      }
      if (operatorW > SW - (MIN_WALL_CLEARANCE * 2)) {
        return `جهاز الباب لفتحة ${value} مم سيكون عرضه ${operatorW} مم وهو ملامس أو يتعدى جدران البئر (الحد الأقصى مع خلوص 30 مم هو ${SW - MIN_WALL_CLEARANCE * 2} مم).`;
      }
    }

    if (field === 'LEFT_MARGIN' || field === 'RIGHT_MARGIN') {
      const maxPossibleMargin = SW - CW - MIN_WALL_CLEARANCE;
      if (value < MIN_WALL_CLEARANCE) {
        return `المسافة ${value} مم أقل من خلوص الأمان المسموح به (الحد الأدنى 30 مم قبل الحائط).`;
      }
      if (value > maxPossibleMargin) {
        return `المسافة ${value} مم تتعدى المساحة المتاحة للكابينة داخل البئر (الحد الأقصى المتاح ${maxPossibleMargin} مم).`;
      }
    }

    if (field === 'SILL_GAP') {
      if (value < MIN_WALL_CLEARANCE) {
        return `خلوص العتبة ${value} مم أقل من الحد الأدنى المسموح به (30 مم قبل الحائط).`;
      }
      if (value > 300) {
        return `خلوص العتبة ${value} مم كبير جداً بصورة غير قياسية.`;
      }
    }

    if (field === 'CWT_REAR_GAP') {
      if (value < MIN_WALL_CLEARANCE) {
        return `المسافة بين الثقل والجدار الخلفي ${value} مم أقل من خلوص الأمان (30 مم).`;
      }
    }

    if (field === 'CAR_CWT_GAP') {
      if (value < 50) {
        return `المسافة بين الكابينة وثقل الموازنة ${value} مم غير مسموحة حسب مواصفة EN 81-20 (الحد الأدنى 50 مم لمنع الاصطدام).`;
      }
    }

    if (field === 'CWT_WIDTH') {
      if (value > SW - (MIN_WALL_CLEARANCE * 2)) {
        return `عرض ثقل الموازنة ${value} مم يتعدى أبعاد البئر وخلوص 30 مم.`;
      }
    }

    if (field === 'CWT_DEPTH') {
      if (value > 400) {
        return `عمق الثقل ${value} مم غير اعتيادي ويستهلك مساحة البئر.`;
      }
    }

    if (field === 'OH') {
      if (value < 2800) {
        return `الارتفاع العلوي (Overhead) ${value} مم غير مطابق لمعايير السلامة EN 81-20 (الحد الأدنى 2800 مم).`;
      }
    }

    if (field === 'PD') {
      if (value < 1000) {
        return `عمق الحفرة (Pit Depth) ${value} مم غير كافٍ لسلامة الفنيين والمخمدات (الحد الأدنى 1000 مم).`;
      }
    }

    if (field === 'TRAVEL') {
      if (value <= 0 || value > 200) {
        return `ارتفاع المشوار ${value} م غير صحيح.`;
      }
    }

    return null;
  };

  const handleOpenDimensionEditor = (
    field: EditableField,
    labelAr: string,
    labelEn: string,
    currentValue: number,
    unit: string = 'mm'
  ) => {
    setEditingField({ field, labelAr, labelEn, currentValue, unit });
    setEditInputValue(String(currentValue));
    setValidationError(null);
  };

  const handleSaveDimension = () => {
    if (!editingField) return;
    const numValue = Number(editInputValue.trim());
    const err = validateDimensionChange(editingField.field, numValue);
    if (err) {
      setValidationError(err);
      return;
    }

    // Apply update to spec or settings
    switch (editingField.field) {
      case 'SW':
        onUpdateSpec?.({ shaftWidthMm: numValue });
        break;
      case 'SD':
        onUpdateSpec?.({ shaftDepthMm: numValue });
        break;
      case 'CW':
        onUpdateSpec?.({ cabinWidthMm: numValue });
        break;
      case 'CD':
        onUpdateSpec?.({ cabinDepthMm: numValue });
        break;
      case 'DW':
        onUpdateSpec?.({ doorWidthMm: numValue });
        break;
      case 'OH':
        onUpdateSpec?.({ overheadHeightMm: numValue });
        break;
      case 'PD':
        onUpdateSpec?.({ pitDepthMm: numValue });
        break;
      case 'TRAVEL':
        onUpdateSpec?.({ travelHeightM: numValue });
        break;
      case 'SILL_GAP':
        handleApplyMargins(numValue, sideMarginOffset, rearMarginOffset);
        if (settings && onUpdateSettings) {
          onUpdateSettings({
            ...settings,
            drawingSettings: { ...settings.drawingSettings, frontSillGapMm: numValue } as any
          });
        }
        break;
      case 'CWT_REAR_GAP':
        if (settings && onUpdateSettings) {
          onUpdateSettings({
            ...settings,
            drawingSettings: { ...settings.drawingSettings, cwtToRearGapMm: numValue } as any
          });
        }
        break;
      case 'CAR_CWT_GAP':
        if (settings && onUpdateSettings) {
          onUpdateSettings({
            ...settings,
            drawingSettings: { ...settings.drawingSettings, carToCwtGapMm: numValue } as any
          });
        }
        break;
      case 'CWT_WIDTH':
        onUpdateSpec?.({ counterweightWidthMm: numValue });
        if (settings && onUpdateSettings) {
          onUpdateSettings({
            ...settings,
            drawingSettings: { ...settings.drawingSettings, cwtWidthMm: numValue } as any
          });
        }
        break;
      case 'CWT_DEPTH':
        onUpdateSpec?.({ counterweightDepthMm: numValue });
        if (settings && onUpdateSettings) {
          onUpdateSettings({
            ...settings,
            drawingSettings: { ...settings.drawingSettings, cwtDepthMm: numValue } as any
          });
        }
        break;
      case 'LEFT_MARGIN': {
        // Left margin = actualLeftMarginMm = (carSvgX - shaftX) / planScale
        // baseCarLeftMm = (baseCarSvgX - shaftX) / planScale
        // New offset = numValue - baseCarLeftMm
        const baseCarLeftMm = Math.round((baseCarSvgX - shaftX) / planScale);
        const newSideOffset = numValue - baseCarLeftMm;
        handleApplyMargins(frontSillMargin, newSideOffset, rearMarginOffset);
        break;
      }
      case 'RIGHT_MARGIN': {
        // Right margin = actualRightMarginMm = (shaftX + shaftSvgW - (carSvgX + carSvgW)) / planScale
        // If right margin is numValue, then left margin = SW - CW - numValue
        const baseCarLeftMm = Math.round((baseCarSvgX - shaftX) / planScale);
        const targetLeftMargin = SW - CW - numValue;
        const newSideOffset = targetLeftMargin - baseCarLeftMm;
        handleApplyMargins(frontSillMargin, newSideOffset, rearMarginOffset);
        break;
      }
    }

    setSuccessNotice(`تم تحديث ${editingField.labelAr} بنجاح إلى ${numValue} ${editingField.unit} وإعادة رسم المخطط.`);
    setEditingField(null);
    setValidationError(null);
  };

  // Real-time millimeter measurements for clearances and display
  const actualFrontClearanceMm = cwtPosition === 'REAR'
    ? Math.max(0, Math.round((shaftY + shaftSvgH - (carSvgY + carSvgH)) / planScale))
    : Math.round(frontSillMargin - rearMarginOffset);
  const actualRearClearanceMm = Math.max(0, Math.round((carSvgY - shaftY) / planScale));
  const actualCwtToRearWallMm = cwtPosition === 'REAR' ? Math.max(0, Math.round((cwtY - shaftY) / planScale)) : 0;
  const actualCwtToSideWallMm = cwtPosition === 'SIDE_LEFT'
    ? Math.max(0, Math.round((cwtX - shaftX) / planScale))
    : cwtPosition === 'SIDE_RIGHT'
    ? Math.max(0, Math.round((shaftX + shaftSvgW - (cwtX + cwtSvgW)) / planScale))
    : 0;
  const actualLeftMarginMm = Math.max(0, Math.round((carSvgX - shaftX) / planScale));
  const actualRightMarginMm = Math.max(0, Math.round((shaftX + shaftSvgW - (carSvgX + carSvgW)) / planScale));
  const actualCarToCwtClearanceMm = cwtPosition === 'REAR'
    ? Math.max(0, Math.round((carSvgY - (cwtY + cwtSvgH)) / planScale))
    : cwtPosition === 'SIDE_LEFT'
    ? Math.max(0, Math.round((carSvgX - (cwtX + cwtSvgW)) / planScale))
    : Math.max(0, Math.round((cwtX - (carSvgX + carSvgW)) / planScale));

  // Color schemes for materials
  const getWallFinishFill = () => {
    switch (spec.wallFinish) {
      case 'MIRROR_ETCHED_GOLD':
        return '#fef08a';
      case 'HAIRLINE_TITANIUM_BLACK':
        return '#334155';
      case 'PANORAMIC_GLASS':
        return '#e0f2fe';
      case 'WOOD_VENEER_LUXURY':
        return '#fed7aa';
      case 'BRUSHED_STEEL_304':
      default:
        return '#e2e8f0';
    }
  };

  const getWallFinishStroke = () => {
    switch (spec.wallFinish) {
      case 'MIRROR_ETCHED_GOLD':
        return '#ca8a04';
      case 'HAIRLINE_TITANIUM_BLACK':
        return '#0f172a';
      case 'PANORAMIC_GLASS':
        return '#0284c7';
      case 'WOOD_VENEER_LUXURY':
        return '#c2410c';
      case 'BRUSHED_STEEL_304':
      default:
        return '#64748b';
    }
  };

  return (
    <div id="elevator-drawings-container" className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
      {/* Top Header & Toolbar */}
      <div className="bg-slate-900 text-white px-3.5 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-slate-100 tracking-tight">
                مخططات CAD الهندسية التفاعلية
              </h3>
              {calc.isShaftWidthCompliant && calc.isShaftDepthCompliant ? (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  <CheckCircle className="w-3 h-3" /> EN 81-20
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  <AlertTriangle className="w-3 h-3" /> تحذير أبعاد
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs overflow-x-auto no-scrollbar scroll-smooth max-w-full">
          <button
            id="btn-view-plan"
            type="button"
            onClick={() => setViewMode('PLAN_VIEW')}
            className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
              viewMode === 'PLAN_VIEW'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            title="Plan View (Cross Section)"
          >
            مسقط أفقي Plan
          </button>
          <button
            id="btn-view-section"
            type="button"
            onClick={() => setViewMode('SECTION_VIEW')}
            className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
              viewMode === 'SECTION_VIEW'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            title="Elevation (Vertical Shaft)"
          >
            قطاع رأسي Section
          </button>
          <button
            id="btn-view-suspension"
            type="button"
            onClick={() => setViewMode('SUSPENSION_VIEW')}
            className={`px-2.5 py-1 rounded font-bold transition-colors flex items-center gap-1 whitespace-nowrap ${
              viewMode === 'SUSPENSION_VIEW'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-amber-300 hover:text-white hover:bg-slate-700/50'
            }`}
            title="نظام التعليق والأثقال CAD"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>تعليق Suspension</span>
          </button>
          <button
            id="btn-view-interior"
            type="button"
            onClick={() => setViewMode('CABIN_INTERIOR')}
            className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
              viewMode === 'CABIN_INTERIOR'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            title="Cabin Interior Detail"
          >
            الكابينة Interior
          </button>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end">
          <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 p-0.5">
            <button
              id="btn-zoom-in"
              type="button"
              onClick={handleZoomIn}
              title="تكبير Zoom In"
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-zoom-out"
              type="button"
              onClick={handleZoomOut}
              title="تصغير Zoom Out"
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-reset-zoom"
              type="button"
              onClick={handleResetZoom}
              title="إعادة ضبط Zoom"
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            id="btn-export-svg"
            type="button"
            onClick={handleDownloadSvg}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 transition-colors shadow-2xs"
            title="تصدير ملف الرسم بصيغة SVG"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">SVG</span>
          </button>

          <button
            id="btn-print-drawing"
            type="button"
            onClick={handlePrintDrawing}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
            title="طباعة لوحة الرسم الهندسي"
          >
            <Printer className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>
      </div>

      {/* Toggles & Technical Sub-Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-600">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDimensions}
              onChange={(e) => setShowDimensions(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">Dimensions</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showClearances}
              onChange={(e) => setShowClearances(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">Safety Clearances</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">Component Labels</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">CAD Grid</span>
          </label>

          <button
            id="btn-toggle-margin-settings"
            
            type="button"
            onClick={() => setShowMarginSettings(!showMarginSettings)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              showMarginSettings
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/40'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            <Move className="w-3.5 h-3.5 text-amber-500" />
            <span>Shaft Margins &amp; Clearances</span>
            {(frontSillMargin !== 30 || sideMarginOffset !== 0 || rearMarginOffset !== 0) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Custom margins active" />
            )}
          
          </button>
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            <span>Default Sizes (القيم الافتراضية)</span>
          </button>

          {/* Quick CWT Position Selector */}
          {onUpdateSpec && (
            <div className="flex items-center bg-slate-200/90 p-0.5 rounded-md border border-slate-300 text-xs">
              <span className="px-1.5 text-[10px] font-bold text-slate-600">الثقل CWT:</span>
              <button
                type="button"
                onClick={() => onUpdateSpec({ counterweightPosition: 'REAR' })}
                title="موضع خلفي قياسي"
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  cwtPosition === 'REAR'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                }`}
              >
                خلفي (Rear)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSpec({ counterweightPosition: 'SIDE_LEFT' })}
                title="موضع يسار عمودي موازي لعمق البئر"
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  cwtPosition === 'SIDE_LEFT'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                }`}
              >
                يسار موازي للعمق (Left)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSpec({ counterweightPosition: 'SIDE_RIGHT' })}
                title="موضع يمين عمودي موازي لعمق البئر"
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  cwtPosition === 'SIDE_RIGHT'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                }`}
              >
                يمين موازي للعمق (Right)
              </button>
            </div>
          )}

          {/* Interactive Double-Click Indicator Badge */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300/80 rounded-md text-[11px] font-medium shadow-2xs">
            <Edit3 className="w-3 h-3 text-amber-600 animate-pulse" />
            <span>انقر مرتين على أي بُعد بالرسم لتعديله مباشرة (Double-Click dimension to edit)</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          <span>Scale: <strong>1:{Math.round(1 / planScale * 0.3)} approx</strong></span>
          <span className="text-slate-300">|</span>
          <span>Shaft: <strong className="text-slate-700">{SW} × {SD} mm</strong></span>
          <span className="text-slate-300">|</span>
          <span>Cabin: <strong className="text-slate-700">{CW} × {CD} mm</strong></span>
          <span className="text-slate-300">|</span>
          <span>Door: <strong className="text-slate-700">{DW} mm ({spec.doorType})</strong></span>
        </div>
      </div>

      {/* Cabin Margin Adjustment & Clearance Calibration Panel */}
      {showMarginSettings && (
        <div className="bg-slate-800 border-b border-slate-700 p-4 text-white animate-in fade-in duration-200">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-bold text-white">
                    Shaft Margins &amp; Cabin Clearance Calibration (معايرة خلوص ومسافات الكابينة بالبئر)
                  </h4>
                  <span className="text-[11px] px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30">
                    EN 81-20 Standard
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fine-tune front running clearance, side alignment, and rear space to ensure safe tolerances and eliminate collisions with counterweight and shaft walls.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToStandardMargins}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to Standard (30mm)
                </button>
                <button
                  type="button"
                  onClick={() => setShowMarginSettings(false)}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium rounded transition-colors"
                >
                  Close Panel
                </button>
              </div>
            </div>

            {/* Margin Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Front Running Sill Clearance */}
              <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-200">Front Sill Clearance (خلوص العتبة الأمامية)</span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-xs ${
                    frontSillMargin >= 25 && frontSillMargin <= 35 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {frontSillMargin} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="1"
                  value={frontSillMargin}
                  onChange={(e) => handleApplyMargins(parseInt(e.target.value, 10), sideMarginOffset, rearMarginOffset)}
                  className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>20 mm</span>
                  <span className="text-emerald-400 font-medium">Standard 30 mm (25-35)</span>
                  <span>150 mm</span>
                </div>
              </div>

              {/* 2. Side Horizontal Offset */}
              <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-200">Side Offset (المحاذاة الأفقية)</span>
                  <span className="font-mono font-bold text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/20 text-xs">
                    {sideMarginOffset > 0 ? `+${sideMarginOffset}` : sideMarginOffset} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-80"
                  max="80"
                  step="5"
                  value={sideMarginOffset}
                  onChange={(e) => handleApplyMargins(frontSillMargin, parseInt(e.target.value, 10), rearMarginOffset)}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>-80 mm (Left)</span>
                  <button
                    type="button"
                    onClick={() => handleApplyMargins(frontSillMargin, 0, rearMarginOffset)}
                    className="text-blue-400 hover:underline"
                  >
                    Center (0 mm)
                  </button>
                  <span>+80 mm (Right)</span>
                </div>
              </div>

              {/* 3. Rear Clearance Offset */}
              <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-200">Rear Clearance Micro-Shift (الخلوص الخلفي)</span>
                  <span className="font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/20 text-xs">
                    {rearMarginOffset > 0 ? `+${rearMarginOffset}` : rearMarginOffset} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="60"
                  step="5"
                  value={rearMarginOffset}
                  onChange={(e) => handleApplyMargins(frontSillMargin, sideMarginOffset, parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>-40 mm</span>
                  <button
                    type="button"
                    onClick={() => handleApplyMargins(frontSillMargin, sideMarginOffset, 0)}
                    className="text-emerald-400 hover:underline"
                  >
                    Nominal (0 mm)
                  </button>
                  <span>+60 mm</span>
                </div>
              </div>
            </div>

            {/* Live Measurements Verification Readout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700/60 text-xs">
                <div className="text-slate-400 text-[11px]">GAP (Front Sill)</div>
                <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                  <span>{actualFrontClearanceMm} mm</span>
                  <span className={`text-[10px] px-1 rounded font-normal ${
                    actualFrontClearanceMm >= 25 && actualFrontClearanceMm <= 35 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {actualFrontClearanceMm >= 25 && actualFrontClearanceMm <= 35 ? 'EN 81-20' : 'Custom'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700/60 text-xs">
                <div className="text-slate-400 text-[11px]">GAP (Car - CWT)</div>
                <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                  <span>{actualCarToCwtClearanceMm} mm</span>
                  <span className={`text-[10px] px-1 rounded font-normal ${
                    actualCarToCwtClearanceMm >= 50 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {actualCarToCwtClearanceMm >= 50 ? 'Safe (≥50)' : 'Tight (<50)'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700/60 text-xs">
                <div className="text-slate-400 text-[11px]">Left Shaft Clearance</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {actualLeftMarginMm} mm
                </div>
              </div>

              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700/60 text-xs">
                <div className="text-slate-400 text-[11px]">Right Shaft Clearance</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {actualRightMarginMm} mm
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If SUSPENSION_VIEW is selected: Render the Dedicated Engineering CAD Suspension Component */}
      {viewMode === 'SUSPENSION_VIEW' ? (
        <div className="p-4 bg-slate-950 flex-1">
          <SuspensionElevationCAD 
            spec={spec} 
            onUpdateRoping={(roping) => onUpdateSpec?.({ ropingRatio: roping })} 
          />
        </div>
      ) : (
        <>
          {/* Elevation Quick Banner to Suspension View */}
          {viewMode === 'SECTION_VIEW' && (
            <div className="bg-blue-900/40 border-b border-blue-500/30 px-4 py-2 flex items-center justify-between text-xs text-blue-200">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>نظام التعليق وحبال الجر ومحاكاة الحركة الحية متاح في تبويب:</span>
              </span>
              <button
                type="button"
                onClick={() => setViewMode('SUSPENSION_VIEW')}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-black transition-colors"
              >
                فتح نظام التعليق CAD 1:1 / 2:1
              </button>
            </div>
          )}

          {/* Main SVG Drawing Canvas */}
          <div dir="ltr" className="relative bg-white flex-1 min-h-[500px] flex items-center justify-center p-4 overflow-hidden select-none">
            <div 
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
              className="w-full max-w-4xl h-full flex items-center justify-center"
            >
              <svg
                ref={svgRef}
                viewBox="0 0 920 690"
                className="w-full h-auto max-h-[620px] drop-shadow-md rounded-lg"
                style={{ backgroundColor: '#ffffff', fontFamily: 'monospace, sans-serif' }}
              >
            <defs>
              {/* Engineering Blueprint Grid */}
              <pattern id="cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
              </pattern>
              <pattern id="cad-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#cad-grid)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
              </pattern>

              {/* Concrete Wall Hatching */}
              <pattern id="concrete-hatch" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="16" stroke="#94a3b8" strokeWidth="1.2" />
                <circle cx="8" cy="8" r="1" fill="#64748b" />
              </pattern>

              {/* Arrowhead Markers */}
              <marker id="arrow-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 8 2 L 2 5 L 8 8 z" fill="#0284c7" />
              </marker>
              <marker id="arrow-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 2 2 L 8 5 L 2 8 z" fill="#0284c7" />
              </marker>

              {/* Linear Gradients for Finishes */}
              <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="steel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f1f5f9" />
                <stop offset="50%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Background Grid */}
            {showGrid && <rect width="920" height="640" fill="url(#cad-grid-major)" />}

            {/* Drawing Title & Border Block */}
            <rect x="15" y="15" width="890" height="610" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
            <rect x="20" y="20" width="880" height="600" fill="none" stroke="#1e293b" strokeWidth="1" />

            {/* ========================================================================= */}
            {/* VIEW 1: PLAN VIEW (HORIZONTAL CROSS SECTION)                              */}
            {/* ========================================================================= */}
            {viewMode === 'PLAN_VIEW' && (
              <g id="cad-plan-view">
                {/* Outer Concrete Shaft Walls */}
                <rect
                  x={shaftX - 30}
                  y={shaftY - 30}
                  width={shaftSvgW + 60}
                  height={shaftSvgH + 60}
                  fill="url(#concrete-hatch)"
                  stroke="#64748b"
                  strokeWidth="2"
                />
                {/* Clear Shaft Interior Opening */}
                <rect
                  x={shaftX}
                  y={shaftY}
                  width={shaftSvgW}
                  height={shaftSvgH}
                  fill="#ffffff"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                />

                {/* Door Opening Cutout - Removes the concrete hatch and lines in front of the door entrance */}
                <rect
                  x={doorSvgX}
                  y={shaftY + shaftSvgH - 2}
                  width={doorSvgW}
                  height={33}
                  fill="#ffffff"
                />

                {/* Shaft Centerlines */}
                <line
                  x1={shaftX - 45}
                  y1={shaftY + shaftSvgH / 2}
                  x2={shaftX + shaftSvgW + 45}
                  y2={shaftY + shaftSvgH / 2}
                  stroke="#38bdf8"
                  strokeWidth="0.8"
                  strokeDasharray="12 4 3 4"
                  strokeOpacity="0.6"
                />
                <line
                  x1={shaftX + shaftSvgW / 2}
                  y1={shaftY - 45}
                  x2={shaftX + shaftSvgW / 2}
                  y2={shaftY + shaftSvgH + 45}
                  stroke="#38bdf8"
                  strokeWidth="0.8"
                  strokeDasharray="12 4 3 4"
                  strokeOpacity="0.6"
                />

                {/* Guide Rails: Left & Right Car Rails */}
                {/* Left Car Rail */}
                <path
                  d={`M ${carSvgX - 22} ${carSvgY + carSvgH / 2 - 8} L ${carSvgX - 14} ${carSvgY + carSvgH / 2 - 8} L ${carSvgX - 14} ${carSvgY + carSvgH / 2 - 3} L ${carSvgX - 8} ${carSvgY + carSvgH / 2 - 3} L ${carSvgX - 8} ${carSvgY + carSvgH / 2 + 3} L ${carSvgX - 14} ${carSvgY + carSvgH / 2 + 3} L ${carSvgX - 14} ${carSvgY + carSvgH / 2 + 8} L ${carSvgX - 22} ${carSvgY + carSvgH / 2 + 8} Z`}
                  fill="#f59e0b"
                  stroke="#d97706"
                  strokeWidth="1"
                />
                {/* Left Wall Bracket: Clear of CWT if on side left */}
                {cwtPosition !== 'SIDE_LEFT' ? (
                  <rect x={shaftX} y={carSvgY + carSvgH / 2 - 14} width={Math.max(16, carSvgX - 8 - shaftX - 14)} height="28" fill="#475569" />
                ) : (
                  <rect x={cwtX + cwtSvgW + 3} y={carSvgY + carSvgH / 2 - 10} width={Math.max(10, carSvgX - 8 - (cwtX + cwtSvgW + 3) - 14)} height="20" fill="#475569" />
                )}

                {/* Right Car Rail */}
                <path
                  d={`M ${carSvgX + carSvgW + 22} ${carSvgY + carSvgH / 2 - 8} L ${carSvgX + carSvgW + 14} ${carSvgY + carSvgH / 2 - 8} L ${carSvgX + carSvgW + 14} ${carSvgY + carSvgH / 2 - 3} L ${carSvgX + carSvgW + 8} ${carSvgY + carSvgH / 2 - 3} L ${carSvgX + carSvgW + 8} ${carSvgY + carSvgH / 2 + 3} L ${carSvgX + carSvgW + 14} ${carSvgY + carSvgH / 2 + 3} L ${carSvgX + carSvgW + 14} ${carSvgY + carSvgH / 2 + 8} L ${carSvgX + carSvgW + 22} ${carSvgY + carSvgH / 2 + 8} Z`}
                  fill="#f59e0b"
                  stroke="#d97706"
                  strokeWidth="1"
                />
                {/* Right Wall Bracket: Clear of CWT if on side right */}
                {cwtPosition !== 'SIDE_RIGHT' ? (
                  <rect x={carSvgX + carSvgW + 22} y={carSvgY + carSvgH / 2 - 14} width={Math.max(16, shaftX + shaftSvgW - (carSvgX + carSvgW + 22))} height="28" fill="#475569" />
                ) : (
                  <rect x={carSvgX + carSvgW + 22} y={carSvgY + carSvgH / 2 - 10} width={Math.max(10, cwtX - 3 - (carSvgX + carSvgW + 22))} height="20" fill="#475569" />
                )}

                {/* Counterweight Block & Rails */}
                <g id="counterweight-plan">
                  {/* CWT Frame & Weights */}
                  <rect
                    x={cwtX}
                    y={cwtY}
                    width={cwtSvgW}
                    height={cwtSvgH}
                    fill="#ffffff"
                    stroke="#0284c7"
                    strokeWidth="1.8"
                    rx="2"
                  />

                  {/* CWT Internal Weight Slices */}
                  {cwtPosition === 'REAR' ? (
                    <>
                      <line x1={cwtX + 10} y1={cwtY + cwtSvgH / 2} x2={cwtX + cwtSvgW - 10} y2={cwtY + cwtSvgH / 2} stroke="#94a3b8" strokeWidth="1" />
                      <line x1={cwtX + cwtSvgW / 3} y1={cwtY + 4} x2={cwtX + cwtSvgW / 3} y2={cwtY + cwtSvgH - 4} stroke="#64748b" strokeWidth="0.8" />
                      <line x1={cwtX + (2 * cwtSvgW) / 3} y1={cwtY + 4} x2={cwtX + (2 * cwtSvgW) / 3} y2={cwtY + cwtSvgH - 4} stroke="#64748b" strokeWidth="0.8" />
                    </>
                  ) : (
                    // Vertical parallel to hoistway depth: central vertical axis and horizontal slice lines
                    <>
                      <line x1={cwtX + cwtSvgW / 2} y1={cwtY + 8} x2={cwtX + cwtSvgW / 2} y2={cwtY + cwtSvgH - 8} stroke="#94a3b8" strokeWidth="1" />
                      <line x1={cwtX + 3} y1={cwtY + cwtSvgH * 0.25} x2={cwtX + cwtSvgW - 3} y2={cwtY + cwtSvgH * 0.25} stroke="#64748b" strokeWidth="0.8" />
                      <line x1={cwtX + 3} y1={cwtY + cwtSvgH * 0.50} x2={cwtX + cwtSvgW - 3} y2={cwtY + cwtSvgH * 0.50} stroke="#64748b" strokeWidth="0.8" />
                      <line x1={cwtX + 3} y1={cwtY + cwtSvgH * 0.75} x2={cwtX + cwtSvgW - 3} y2={cwtY + cwtSvgH * 0.75} stroke="#64748b" strokeWidth="0.8" />
                    </>
                  )}
                  
                  {/* CWT Rails and Brackets */}
                  {cwtPosition === 'REAR' ? (
                    <>
                      <rect x={cwtX - 10} y={cwtY + cwtSvgH / 2 - 4} width="10" height="8" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
                      <rect x={cwtX + cwtSvgW} y={cwtY + cwtSvgH / 2 - 4} width="10" height="8" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
                    </>
                  ) : (
                    // When on side, rails are at front and rear ends of the CWT along the shaft depth
                    <>
                      <rect x={cwtX + cwtSvgW / 2 - 4} y={cwtY - 10} width="8" height="10" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
                      <rect x={cwtX + cwtSvgW / 2 - 4} y={cwtY + cwtSvgH} width="8" height="10" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
                      {/* Brackets to the side wall */}
                      {cwtPosition === 'SIDE_LEFT' ? (
                        <>
                          <rect x={shaftX} y={cwtY - 12} width={Math.max(6, cwtX - shaftX)} height="14" fill="#475569" opacity="0.85" />
                          <rect x={shaftX} y={cwtY + cwtSvgH - 2} width={Math.max(6, cwtX - shaftX)} height="14" fill="#475569" opacity="0.85" />
                        </>
                      ) : (
                        <>
                          <rect x={cwtX + cwtSvgW} y={cwtY - 12} width={Math.max(6, shaftX + shaftSvgW - (cwtX + cwtSvgW))} height="14" fill="#475569" opacity="0.85" />
                          <rect x={cwtX + cwtSvgW} y={cwtY + cwtSvgH - 2} width={Math.max(6, shaftX + shaftSvgW - (cwtX + cwtSvgW))} height="14" fill="#475569" opacity="0.85" />
                        </>
                      )}
                    </>
                  )}

                  {/* CWT Identification and Dimensions Text inside CWT rectangle */}
                  {cwtPosition === 'REAR' ? (
                    <>
                      <text
                        x={cwtX + cwtSvgW / 2}
                        y={cwtY + cwtSvgH / 2 - 3}
                        fill="#1e293b"
                        fontSize="9.5"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        CWT (خلفي REAR)
                      </text>
                      <text
                        x={cwtX + cwtSvgW / 2}
                        y={cwtY + cwtSvgH / 2 + 10}
                        fill="#0284c7"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        <tspan
                          className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleOpenDimensionEditor('CWT_WIDTH', 'عرض ثقل الموازنة (CWT Width)', 'Counterweight Width', safeCwtWidthMm);
                          }}
                        >
                          {safeCwtWidthMm}mm ✎
                        </tspan>
                        <tspan fill="#64748b"> × </tspan>
                        <tspan
                          className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleOpenDimensionEditor('CWT_DEPTH', 'عمق ثقل الموازنة (CWT Depth)', 'Counterweight Depth', safeCwtDepthMm);
                          }}
                        >
                          {safeCwtDepthMm}mm ✎
                        </tspan>
                        <title>انقر مرتين على العرض أو العمق لتعديل أبعاد ثقل الموازنة</title>
                      </text>
                    </>
                  ) : (
                    // Vertical parallel to depth: rotate text along vertical direction
                    <g transform={`rotate(-90 ${cwtX + cwtSvgW / 2} ${cwtY + cwtSvgH / 2})`}>
                      <text
                        x={cwtX + cwtSvgW / 2}
                        y={cwtY + cwtSvgH / 2 - 4}
                        fill="#1e293b"
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
                        fill="#0284c7"
                        fontSize="8.5"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleOpenDimensionEditor('CWT_WIDTH', 'طول ثقل الموازنة موازي للعمق (CWT Length)', 'Counterweight Length', safeCwtWidthMm);
                          }}
                        >
                          {safeCwtWidthMm}mm ✎
                        </tspan>
                        <tspan fill="#64748b"> × </tspan>
                        <tspan
                          className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleOpenDimensionEditor('CWT_DEPTH', 'سماكة ثقل الموازنة (CWT Thickness)', 'Counterweight Thickness', safeCwtDepthMm);
                          }}
                        >
                          {safeCwtDepthMm}mm ✎
                        </tspan>
                        <title>انقر مرتين لتعديل أبعاد ثقل الموازنة الجانبي العمودي</title>
                      </text>
                    </g>
                  )}
                </g>

                {/* Cabin Shell & Platform */}
                <g id="cabin-plan">
                  {/* Outer sling frame */}
                  <rect
                    x={carSvgX - 8}
                    y={carSvgY - 6}
                    width={carSvgW + 16}
                    height={carSvgH + 12}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="6 3"
                  />

                  {/* Cabin Walls */}
                  <rect
                    x={carSvgX}
                    y={carSvgY}
                    width={carSvgW}
                    height={carSvgH}
                    fill={getWallFinishFill()}
                    stroke={getWallFinishStroke()}
                    strokeWidth="2.5"
                    rx="3"
                  />

                  {/* Cabin Interior Flooring Texture / Details */}
                  <rect
                    x={carSvgX + 6}
                    y={carSvgY + 6}
                    width={carSvgW - 12}
                    height={carSvgH - 12}
                    fill="#ffffff"
                    stroke="#cbd5e1"
                    strokeWidth="0.8"
                  />


                  {/* Car & Landing Entrance Doors */}
                  <g id="car-entrance-doors">
                    {/* --- Car Door (باب الكابينة الداخلي) مع الزيادة البرتقالية الملتصقة --- */}
                    {/* Front Door Opening Gap in Cabin Wall */}
                    <rect
                      x={doorSvgX}
                      y={carSvgY + carSvgH - 3}
                      width={doorSvgW}
                      height="6"
                      fill="#ffffff"
                    />

                    {/* Sliding Car Door Panels & Orange Operator Extensions */}
                    {spec.doorType === 'CENTER_2P' || spec.doorType === 'CENTER_4P' ? (
                      <>
                        {/* الزيادة البرتقالية لجهاز الباب السنتر: ملتصقة بالباب الأزرق من اليسار واليمين */}
                        {/* Left Operator Extension (برتقالي ملتصق بالباب من اليسار) */}
                        <rect
                          x={doorSvgX - ((doorOperatorSvgW - doorSvgW) / 2)}
                          y={carSvgY + carSvgH - 1}
                          width={(doorOperatorSvgW - doorSvgW) / 2}
                          height="4"
                          fill="#f97316"
                          stroke="#c2410c"
                          strokeWidth="1"
                          rx="1"
                          className="cursor-pointer"
                          onDoubleClick={() => handleOpenDimensionEditor('DW', 'فتحة وعرض جهاز الباب', 'Door Width & Operator', DW)}
                        >
                          <title>امتداد جهاز الباب السنتر (برتقالي: {(doorOperatorWidthMm - DW) / 2} مم يمين ويسار)</title>
                        </rect>

                        {/* Left Car Door Panel (أزرق سماوي للباب الداخلي) */}
                        <rect
                          x={doorSvgX + 4}
                          y={carSvgY + carSvgH - 1}
                          width={doorSvgW / 2 - 6}
                          height="4"
                          fill="#0284c7"
                          stroke="#0284c7"
                          strokeWidth="1"
                          rx="1"
                        />
                        {/* Right Car Door Panel (أزرق سماوي للباب الداخلي) */}
                        <rect
                          x={doorSvgX + doorSvgW / 2 + 2}
                          y={carSvgY + carSvgH - 1}
                          width={doorSvgW / 2 - 6}
                          height="4"
                          fill="#0284c7"
                          stroke="#0284c7"
                          strokeWidth="1"
                          rx="1"
                        />

                        {/* Right Operator Extension (برتقالي ملتصق بالباب من اليمين) */}
                        <rect
                          x={doorSvgX + doorSvgW}
                          y={carSvgY + carSvgH - 1}
                          width={(doorOperatorSvgW - doorSvgW) / 2}
                          height="4"
                          fill="#f97316"
                          stroke="#c2410c"
                          strokeWidth="1"
                          rx="1"
                          className="cursor-pointer"
                          onDoubleClick={() => handleOpenDimensionEditor('DW', 'فتحة وعرض جهاز الباب', 'Door Width & Operator', DW)}
                        >
                          <title>امتداد جهاز الباب السنتر (برتقالي: {(doorOperatorWidthMm - DW) / 2} مم يمين ويسار)</title>
                        </rect>
                      </>
                    ) : (
                      // Side opening telescopic door for Car (الباب الجانبي)
                      <>
                        {/* لوح الباب الداخلي الأول (أزرق) */}
                        <rect
                          x={doorSvgX + 4}
                          y={carSvgY + carSvgH - 1}
                          width={doorSvgW * 0.48}
                          height="4"
                          fill="#0284c7"
                          stroke="#0284c7"
                          strokeWidth="1"
                          rx="1"
                        />
                        {/* لوح الباب الداخلي الثاني (أزرق) */}
                        <rect
                          x={doorSvgX + doorSvgW * 0.48}
                          y={carSvgY + carSvgH - 5}
                          width={doorSvgW * 0.48}
                          height="4"
                          fill="#0284c7"
                          stroke="#0284c7"
                          strokeWidth="1"
                          rx="1"
                        />

                        {/* الزيادة البرتقالية للباب الجانبي (ملتصقة بالباب الأزرق وممتدة 5 سم على كل 1 متر) */}
                        <rect
                          x={doorSvgX + doorSvgW}
                          y={carSvgY + carSvgH - 3}
                          width={doorOperatorSvgW - doorSvgW}
                          height="5"
                          fill="#f97316"
                          stroke="#c2410c"
                          strokeWidth="1"
                          rx="1"
                          className="cursor-pointer"
                          onDoubleClick={() => handleOpenDimensionEditor('DW', 'فتحة وعرض جهاز الباب', 'Door Width & Operator', DW)}
                        >
                          <title>زيادة جهاز الباب الجانبي (برتقالي: {doorOperatorWidthMm - DW} مم)</title>
                        </rect>
                      </>
                    )}

                    {/* --- Landing Door (باب الدور الأرضي) --- */}
                    {/* Drawn at the shaft landing sill */}
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
                        {/* Left Landing Door Panel */}
                        <rect
                          x={doorSvgX + 4}
                          y={shaftY + shaftSvgH - 1}
                          width={doorSvgW / 2 - 6}
                          height="4"
                          fill="#0284c7"
                          stroke="#0284c7"
                          strokeWidth="1"
                          rx="1"
                        />
                        {/* Right Landing Door Panel */}
                        <rect
                          x={doorSvgX + doorSvgW / 2 + 2}
                          y={shaftY + shaftSvgH - 1}
                          width={doorSvgW / 2 - 6}
                          height="4"
                          fill="#0284c7"
                          stroke="#0284c7"
                          strokeWidth="1"
                          rx="1"
                        />
                      </>
                    ) : (
                      // Side opening telescopic door for Landing
                      <>
                        <rect
                          x={doorSvgX + 4}
                          y={shaftY + shaftSvgH - 1}
                          width={doorSvgW * 0.48}
                          height="4"
                          fill="#0284c7"
                          stroke="#0284c7"
                          strokeWidth="1"
                          rx="1"
                        />
                        <rect
                          x={doorSvgX + doorSvgW * 0.48}
                          y={shaftY + shaftSvgH + 3}
                          width={doorSvgW * 0.48}
                          height="4"
                          fill="#0284c7"
                          stroke="#0284c7"
                          strokeWidth="1"
                          rx="1"
                        />
                      </>
                    )}
                  </g>

                  {/* --- Door Operator Label (جهاز الباب) --- */}
                  <g id="door-operator-assembly">
                    {/* Door operator physical bar is drawn above, text label deleted as requested */}
                  </g>

                    {/* Cabin Label */}
                  {showLabels && (
                    <text
                      x={carSvgX + carSvgW / 2}
                      y={carSvgY + carSvgH / 2 - 18}
                      fill="#0f172a"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      CABIN ({spec.capacityKg} kg / {spec.personsCount} Pers)
                    </text>
                  )}
                </g>

                {/* ================= DIMENSION LINES ================= */}
                {showDimensions && (
                  <g id="dimension-lines-plan">
                    {/* Shaft Width (SW) Dimension Top */}
                    <line
                      x1={shaftX}
                      y1={shaftY - 55}
                      x2={shaftX + shaftSvgW}
                      y2={shaftY - 55}
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      markerStart="url(#arrow-start)"
                      markerEnd="url(#arrow-end)"
                    />
                    <line x1={shaftX} y1={shaftY - 60} x2={shaftX} y2={shaftY} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" />
                    <line x1={shaftX + shaftSvgW} y1={shaftY - 60} x2={shaftX + shaftSvgW} y2={shaftY} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" />
                    <text
                      x={shaftX + shaftSvgW / 2}
                      y={shaftY - 55}
                      fill="#0284c7"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                      onDoubleClick={() => handleOpenDimensionEditor('SW', 'عرض البئر', 'Shaft Width (SW)', SW)}
                    >
                      SW = {SW} mm ✎
                      <title>انقر مرتين لتعديل عرض البئر (Double click to edit SW)</title>
                    </text>
                    {/* Shaft Depth (SD) Dimension Left */}
                    <line
                      x1={shaftX - 55}
                      y1={shaftY}
                      x2={shaftX - 55}
                      y2={shaftY + shaftSvgH}
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      markerStart="url(#arrow-start)"
                      markerEnd="url(#arrow-end)"
                    />
                    <line x1={shaftX - 60} y1={shaftY} x2={shaftX} y2={shaftY} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" />
                    <line x1={shaftX - 60} y1={shaftY + shaftSvgH} x2={shaftX} y2={shaftY + shaftSvgH} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" />
                    <text
                      x={shaftX - 55}
                      y={shaftY + shaftSvgH / 2}
                      transform={`rotate(-90 ${shaftX - 55} ${shaftY + shaftSvgH / 2})`}
                      fill="#0284c7"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                      onDoubleClick={() => handleOpenDimensionEditor('SD', 'عمق البئر', 'Shaft Depth (SD)', SD)}
                    >
                      SD = {SD} mm ✎
                      <title>انقر مرتين لتعديل عمق البئر (Double click to edit SD)</title>
                    </text>
                    {/* Cabin Width (CW) Dimension Inside */}
                    <line
                      x1={carSvgX}
                      y1={carSvgY + 24}
                      x2={carSvgX + carSvgW}
                      y2={carSvgY + 24}
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      markerStart="url(#arrow-start)"
                      markerEnd="url(#arrow-end)"
                    />
                    <text
                      x={carSvgX + carSvgW / 2}
                      y={carSvgY + 24}
                      fill="#0284c7"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                      onDoubleClick={() => handleOpenDimensionEditor('CW', 'عرض الكابينة', 'Cabin Width (CW)', CW)}
                    >
                      CW = {CW} mm ✎
                      <title>انقر مرتين لتعديل عرض الكابينة (Double click to edit CW)</title>
                    </text>
                    {/* Cabin Depth (CD) Dimension Right */}
                    <line
                      x1={carSvgX + carSvgW - 24}
                      y1={carSvgY}
                      x2={carSvgX + carSvgW - 24}
                      y2={carSvgY + carSvgH}
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      markerStart="url(#arrow-start)"
                      markerEnd="url(#arrow-end)"
                    />
                    <text
                      x={carSvgX + carSvgW - 24}
                      y={carSvgY + carSvgH / 2}
                      transform={`rotate(-90 ${carSvgX + carSvgW - 24} ${carSvgY + carSvgH / 2})`}
                      fill="#0284c7"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                      onDoubleClick={() => handleOpenDimensionEditor('CD', 'عمق الكابينة', 'Cabin Depth (CD)', CD)}
                    >
                      CD = {CD} mm ✎
                      <title>انقر مرتين لتعديل عمق الكابينة (Double click to edit CD)</title>
                    </text>
                    {/* Door Clear Opening (DW) Bottom */}
                    <line
                      x1={doorSvgX}
                      y1={carSvgY + carSvgH - 24}
                      x2={doorSvgX + doorSvgW}
                      y2={carSvgY + carSvgH - 24}
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      markerStart="url(#arrow-start)"
                      markerEnd="url(#arrow-end)"
                    />
                    <text
                      x={doorSvgX + doorSvgW / 2}
                      y={carSvgY + carSvgH - 24}
                      fill="#f59e0b"
                      fontSize="9.5"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="cursor-pointer select-none hover:fill-amber-300 transition-colors"
                      onDoubleClick={() => handleOpenDimensionEditor('DW', 'عرض فتحة الباب', 'Door Clear Opening (DW)', DW)}
                    >
                      <tspan x={doorSvgX + doorSvgW / 2} dy="-5">Clear Opening DW = {DW} mm ✎</tspan>
                      <tspan x={doorSvgX + doorSvgW / 2} dy="12" fontSize="8.5" fill="#d97706">({spec.doorType.replace('_', ' ')})</tspan>
                      <title>انقر مرتين لتعديل فتحة الباب (Double click to edit DW)</title>
                    </text>
                    {/* Front Sill Gap Line & Label */}
                    <line
                      x1={carSvgX + 40}
                      y1={carSvgY + carSvgH}
                      x2={carSvgX + 40}
                      y2={shaftY + shaftSvgH}
                      stroke="#0284c7"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                      markerStart="url(#arrow-start)"
                      markerEnd="url(#arrow-end)"
                    />
                    <text
                      x={carSvgX + 48}
                      y={carSvgY + carSvgH + (shaftY + shaftSvgH - (carSvgY + carSvgH)) / 2 + 3}
                      fill="#0284c7"
                      fontSize="9"
                      fontWeight="bold"
                      className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                      onDoubleClick={() => handleOpenDimensionEditor('SILL_GAP', 'خلوص العتبة الأمامية', 'GAP (Front Sill)', actualFrontClearanceMm)}
                    >
                      GAP: {actualFrontClearanceMm} mm ✎
                      <title>انقر مرتين لتعديل خلوص العتبة الأمامية</title>
                    </text>
                  </g>
                )}

                {/* ================= SAFETY CLEARANCES CALLOUTS ================= */}
                {showClearances && (
                  <g id="safety-clearances">
                    {/* Left Shaft Margin */}
                    <line
                      x1={shaftX}
                      y1={carSvgY + 25}
                      x2={carSvgX}
                      y2={carSvgY + 25}
                      stroke="#f59e0b"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      markerStart="url(#arrow-start)"
                      markerEnd="url(#arrow-end)"
                    />
                    <text
                      x={shaftX + (carSvgX - shaftX) / 2}
                      y={carSvgY + 21}
                      fill="#22c55e"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="cursor-pointer select-none hover:fill-emerald-300 transition-colors"
                      onDoubleClick={() => handleOpenDimensionEditor('LEFT_MARGIN', 'المسافة اليسرى للكابينة عن البئر (L)', 'Left Margin (L)', actualLeftMarginMm)}
                    >
                      L: {actualLeftMarginMm} mm ✎
                      <title>انقر مرتين لتعديل الخلوص الأيسر للكابينة (Double click to edit Left Margin L)</title>
                    </text>

                    {/* Right Shaft Margin */}
                    <line
                      x1={carSvgX + carSvgW}
                      y1={carSvgY + 25}
                      x2={shaftX + shaftSvgW}
                      y2={carSvgY + 25}
                      stroke="#f59e0b"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      markerStart="url(#arrow-start)"
                      markerEnd="url(#arrow-end)"
                    />
                    <text
                      x={carSvgX + carSvgW + (shaftX + shaftSvgW - (carSvgX + carSvgW)) / 2}
                      y={carSvgY + 21}
                      fill="#22c55e"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="cursor-pointer select-none hover:fill-emerald-300 transition-colors"
                      onDoubleClick={() => handleOpenDimensionEditor('RIGHT_MARGIN', 'المسافة اليمنى للكابينة عن البئر (R)', 'Right Margin (R)', actualRightMarginMm)}
                    >
                      R: {actualRightMarginMm} mm ✎
                      <title>انقر مرتين لتعديل الخلوص الأيمن للكابينة (Double click to edit Right Margin R)</title>
                    </text>

                    {/* Side Rail Gauge DBG */}
                    <line
                      x1={carSvgX - 8}
                      y1={carSvgY + carSvgH / 2}
                      x2={carSvgX + carSvgW + 8}
                      y2={carSvgY + carSvgH / 2}
                      stroke="#94a3b8"
                      strokeWidth="0.8"
                      markerStart="url(#arrow-start)"
                      markerEnd="url(#arrow-end)"
                    />
                    <line x1={carSvgX - 8} y1={carSvgY + carSvgH / 2 - 12} x2={carSvgX - 8} y2={carSvgY + carSvgH / 2 + 12} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2 2" />
                    <line x1={carSvgX + carSvgW + 8} y1={carSvgY + carSvgH / 2 - 12} x2={carSvgX + carSvgW + 8} y2={carSvgY + carSvgH / 2 + 12} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2 2" />
                    <text x={carSvgX + carSvgW / 2} y={carSvgY + carSvgH / 2} fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                      DBG Rail Gauge: {calc.dbgRailGaugeMm} mm
                    </text>
                    {/* Cwt to Wall Clearance */}
                    {cwtPosition === 'REAR' ? (
                      <>
                        <line
                          x1={cwtX + cwtSvgW / 2}
                          y1={shaftY}
                          x2={cwtX + cwtSvgW / 2}
                          y2={cwtY}
                          stroke="#22c55e"
                          strokeWidth="1.2"
                          markerStart="url(#arrow-start)"
                          markerEnd="url(#arrow-end)"
                        />
                        <text
                          x={cwtX + cwtSvgW / 2 + 8}
                          y={shaftY + (cwtY - shaftY) / 2 + 3}
                          fill="#22c55e"
                          fontSize="9"
                          fontWeight="bold"
                          className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                          onDoubleClick={() => handleOpenDimensionEditor('CWT_REAR_GAP', 'خلوص الثقل عن الجدار الخلفي', 'CWT-to-Rear Gap', actualCwtToRearWallMm)}
                        >
                          GAP: {actualCwtToRearWallMm} mm ✎
                          <title>انقر مرتين لتعديل خلوص الثقل عن الجدار الخلفي</title>
                        </text>
                      </>
                    ) : cwtPosition === 'SIDE_LEFT' ? (
                      <>
                        {/* CWT to Left Wall clearance line */}
                        <line
                          x1={shaftX}
                          y1={cwtY + cwtSvgH / 2}
                          x2={cwtX}
                          y2={cwtY + cwtSvgH / 2}
                          stroke="#22c55e"
                          strokeWidth="1.2"
                          markerStart="url(#arrow-start)"
                          markerEnd="url(#arrow-end)"
                        />
                      </>
                    ) : (
                      <>
                        {/* CWT to Right Wall clearance line */}
                        <line
                          x1={cwtX + cwtSvgW}
                          y1={cwtY + cwtSvgH / 2}
                          x2={shaftX + shaftSvgW}
                          y2={cwtY + cwtSvgH / 2}
                          stroke="#22c55e"
                          strokeWidth="1.2"
                          markerStart="url(#arrow-start)"
                          markerEnd="url(#arrow-end)"
                        />
                      </>
                    )}

                    {/* Cwt to Car Clearance */}
                    {cwtPosition === 'REAR' ? (
                      <>
                        <line
                          x1={cwtX + cwtSvgW / 2}
                          y1={cwtY + cwtSvgH}
                          x2={cwtX + cwtSvgW / 2}
                          y2={carSvgY}
                          stroke="#22c55e"
                          strokeWidth="1.2"
                          markerStart="url(#arrow-start)"
                          markerEnd="url(#arrow-end)"
                        />
                        <text
                          x={cwtX + cwtSvgW / 2 + 8}
                          y={cwtY + cwtSvgH + (carSvgY - (cwtY + cwtSvgH)) / 2 + 3}
                          fill="#22c55e"
                          fontSize="9"
                          fontWeight="bold"
                          className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                          onDoubleClick={() => handleOpenDimensionEditor('CAR_CWT_GAP', 'الخلوص بين الكابينة وثقل الموازنة', 'Car-to-CWT Gap', actualCarToCwtClearanceMm)}
                        >
                          GAP: {actualCarToCwtClearanceMm} mm ✎
                          <title>انقر مرتين لتعديل الخلوص بين الكابينة والثقل</title>
                        </text>
                      </>
                    ) : cwtPosition === 'SIDE_LEFT' ? (
                      <>
                        {/* Horizontal clearance line between CWT right edge and Car left edge */}
                        <line
                          x1={cwtX + cwtSvgW}
                          y1={cwtY + cwtSvgH / 2}
                          x2={carSvgX}
                          y2={cwtY + cwtSvgH / 2}
                          stroke="#22c55e"
                          strokeWidth="1.2"
                          markerStart="url(#arrow-start)"
                          markerEnd="url(#arrow-end)"
                        />
                        <text
                          x={cwtX + cwtSvgW + (carSvgX - (cwtX + cwtSvgW)) / 2}
                          y={cwtY + cwtSvgH / 2 - 4}
                          fill="#22c55e"
                          fontSize="8.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                          onDoubleClick={() => handleOpenDimensionEditor('CAR_CWT_GAP', 'الخلوص بين الكابينة وثقل الموازنة', 'Car-to-CWT Gap', actualCarToCwtClearanceMm)}
                        >
                          GAP: {actualCarToCwtClearanceMm} mm ✎
                          <title>انقر مرتين لتعديل الخلوص بين الكابينة والثقل</title>
                        </text>
                      </>
                    ) : (
                      <>
                        {/* Horizontal clearance line between Car right edge and CWT left edge */}
                        <line
                          x1={carSvgX + carSvgW}
                          y1={cwtY + cwtSvgH / 2}
                          x2={cwtX}
                          y2={cwtY + cwtSvgH / 2}
                          stroke="#22c55e"
                          strokeWidth="1.2"
                          markerStart="url(#arrow-start)"
                          markerEnd="url(#arrow-end)"
                        />
                        <text
                          x={carSvgX + carSvgW + (cwtX - (carSvgX + carSvgW)) / 2}
                          y={cwtY + cwtSvgH / 2 - 4}
                          fill="#22c55e"
                          fontSize="8.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                          onDoubleClick={() => handleOpenDimensionEditor('CAR_CWT_GAP', 'الخلوص بين الكابينة وثقل الموازنة', 'Car-to-CWT Gap', actualCarToCwtClearanceMm)}
                        >
                          GAP: {actualCarToCwtClearanceMm} mm ✎
                          <title>انقر مرتين لتعديل الخلوص بين الكابينة والثقل</title>
                        </text>
                      </>
                    )}

                    {/* Front Sill Gap Line & Label */}
                    <line
                      x1={carSvgX + 40}
                      y1={carSvgY + carSvgH}
                      x2={carSvgX + 40}
                      y2={shaftY + shaftSvgH}
                      stroke="#0284c7"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                      markerStart="url(#arrow-start)"
                      markerEnd="url(#arrow-end)"
                    />
                    <text
                      x={carSvgX + 48}
                      y={carSvgY + carSvgH + (shaftY + shaftSvgH - (carSvgY + carSvgH)) / 2 + 3}
                      fill="#0284c7"
                      fontSize="9"
                      fontWeight="bold"
                      className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                      onDoubleClick={() => handleOpenDimensionEditor('SILL_GAP', 'خلوص العتبة الأمامية', 'GAP (Front Sill)', actualFrontClearanceMm)}
                    >
                      GAP: {actualFrontClearanceMm} mm ✎
                      <title>انقر مرتين لتعديل خلوص العتبة الأمامية</title>
                    </text>
                  </g>
                )}

                
                    
                {/* Landing Entrance Direction Indicator */}
                <g transform={`translate(${shaftX + shaftSvgW / 2}, ${shaftY + shaftSvgH + 52})`}>
                  <line x1="0" y1="12" x2="0" y2="-4" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-end)" />
                  <text x="0" y="24" fill="#1e293b" fontSize="10" fontWeight="bold" textAnchor="middle">
                    LANDING ENTRANCE / SILL
                  </text>
                </g>
              </g>
            )}

            {/* ========================================================================= */}
            {/* VIEW 2: ELEVATION / SECTION VIEW (VERTICAL SHAFT PROFILE)                 */}
            {/* ========================================================================= */}
            {viewMode === 'SECTION_VIEW' && (
              <g id="cad-section-view">
                {/* Vertical Shaft Enclosure */}
                {/* Coordinates: Left X: 220, Right X: 640 */}
                {/* Pit Bottom: Y 520, Overhead Top Slab: Y 80 */}
                {/* Ground Level Landing: Y 420 */}
                <rect x="220" y="70" width="420" height="470" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
                {/* Pit Floor Concrete Foundation */}
                <rect x="180" y="540" width="500" height="40" fill="url(#concrete-hatch)" stroke="#64748b" strokeWidth="1.5" />
                {/* Overhead Roof Slab */}
                <rect x="180" y="40" width="500" height="30" fill="url(#concrete-hatch)" stroke="#64748b" strokeWidth="1.5" />

                {/* Machine Room-Less Motor Assembly at Top */}
                <g id="mrl-motor-section">
                  <rect x="360" y="85" width="140" height="45" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" rx="4" />
                  {/* Traction Sheave */}
                  <circle cx="430" cy="115" r="28" fill="#ffffff" stroke="#f59e0b" strokeWidth="3" />
                  <circle cx="430" cy="115" r="10" fill="#475569" />
                  {/* Deflector Sheave */}
                  <circle cx="530" cy="120" r="18" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
                  {showLabels && (
                    <text x="430" y="78" fill="#2563eb" fontSize="10" fontWeight="bold" textAnchor="middle">
                      PMSM Gearless Machine ({calc.motorPowerKw} kW)
                    </text>
                  )}
                </g>

                {/* Vertical Guide Rails */}
                <line x1="290" y1="80" x2="290" y2="535" stroke="#f59e0b" strokeWidth="2.5" />
                <line x1="450" y1="80" x2="450" y2="535" stroke="#f59e0b" strokeWidth="2.5" />
                <line x1="550" y1="80" x2="550" y2="535" stroke="#d97706" strokeWidth="2" />

                {/* Car Sling & Cabin Suspended at Ground / Mid Floor */}
                <g id="car-section" transform="translate(295, 260)">
                  {/* Upper Crosshead */}
                  <rect x="0" y="0" width="150" height="14" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
                  {/* Car Upright Stiles */}
                  <rect x="4" y="14" width="8" height="140" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                  <rect x="138" y="14" width="8" height="140" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                  {/* Lower Safety Plank */}
                  <rect x="0" y="154" width="150" height="16" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
                  {/* Progressive Safety Gear Under Car */}
                  <rect x="4" y="170" width="22" height="12" fill="#ef4444" rx="2" />
                  <rect x="124" y="170" width="22" height="12" fill="#ef4444" rx="2" />

                  {/* Cabin Body */}
                  <rect x="16" y="16" width="118" height="136" fill={getWallFinishFill()} stroke={getWallFinishStroke()} strokeWidth="2" />
                  {/* Ceiling & Lighting */}
                  <rect x="20" y="20" width="110" height="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8" />
                  {/* Interior Passenger Figures */}
                  <circle cx="60" cy="70" r="8" fill="#475569" />
                  <rect x="52" y="80" width="16" height="30" fill="#475569" rx="2" />
                  <circle cx="90" cy="70" r="8" fill="#475569" />
                  <rect x="82" y="80" width="16" height="30" fill="#475569" rx="2" />
                  {/* Door Opening Front Left */}
                  <rect x="16" y="24" width="12" height="128" fill="#0284c7" stroke="#0284c7" strokeWidth="1" />

                  {/* 2:1 Under-Car Diverter Pulleys */}
                  {spec.ropingRatio === '2:1' && (
                    <>
                      <circle cx="35" cy="180" r="12" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.8" />
                      <circle cx="115" cy="180" r="12" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.8" />
                    </>
                  )}

                  {showLabels && (
                    <text x="75" y="125" fill="#0f172a" fontSize="10" fontWeight="bold" textAnchor="middle">
                      CAR ({CW}×{CD} mm)
                    </text>
                  )}
                </g>

                {/* Counterweight in Section */}
                <g id="cwt-section" transform="translate(525, 170)">
                  <rect x="0" y="0" width="50" height="130" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.8" rx="2" />
                  {/* CWT Weights */}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <line key={i} x1="4" y1={20 + i * 18} x2="46" y2={20 + i * 18} stroke="#64748b" strokeWidth="1" />
                  ))}
                  {/* CWT Top Pulley for 2:1 */}
                  {spec.ropingRatio === '2:1' && (
                    <circle cx="25" cy="-8" r="12" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" />
                  )}
                  {showLabels && (
                    <text x="25" y="65" fill="#1e293b" fontSize="9" fontWeight="bold" textAnchor="middle">
                      CWT
                    </text>
                  )}
                </g>

                {/* Suspension Wire Ropes */}
                <line x1="330" y1="260" x2="430" y2="115" stroke="#f59e0b" strokeWidth="1.8" />
                <line x1="410" y1="260" x2="430" y2="115" stroke="#f59e0b" strokeWidth="1.8" />
                <line x1="430" y1="115" x2="530" y2="120" stroke="#f59e0b" strokeWidth="1.8" />
                <line x1="550" y1="120" x2="550" y2="170" stroke="#f59e0b" strokeWidth="1.8" />

                {/* Pit Buffers on Concrete Floor */}
                <g id="pit-buffers">
                  {/* Car Buffer */}
                  <rect x="355" y="495" width="30" height="45" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" rx="3" />
                  <line x1="350" y1="535" x2="390" y2="535" stroke="#94a3b8" strokeWidth="3" />
                  {/* CWT Buffer */}
                  <rect x="535" y="495" width="30" height="45" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" rx="3" />
                  <line x1="530" y1="535" x2="570" y2="535" stroke="#94a3b8" strokeWidth="3" />
                  {/* Pit Access Ladder */}
                  <line x1="235" y1="430" x2="235" y2="540" stroke="#cbd5e1" strokeWidth="2" />
                  <line x1="247" y1="430" x2="247" y2="540" stroke="#cbd5e1" strokeWidth="2" />
                  {Array.from({ length: 6 }).map((_, i) => (
                    <line key={i} x1="235" y1={445 + i * 16} x2="247" y2={445 + i * 16} stroke="#cbd5e1" strokeWidth="1.5" />
                  ))}
                </g>

                {/* Floor Levels & Openings on Left Side */}
                <g id="floor-levels">
                  {/* Top Landing */}
                  <line x1="160" y1="180" x2="220" y2="180" stroke="#38bdf8" strokeWidth="2" />
                  <text x="150" y="175" fill="#0284c7" fontSize="10" fontWeight="bold" textAnchor="end">
                    Top Floor (L{spec.stops})
                  </text>

                  {/* Mid Landing */}
                  <line x1="160" y1="310" x2="220" y2="310" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 2" />
                  <text x="150" y="315" fill="#64748b" fontSize="9" textAnchor="end">
                    Intermediate Stops
                  </text>

                  {/* Bottom Landing (Datum 0.00) */}
                  <line x1="160" y1="440" x2="220" y2="440" stroke="#22c55e" strokeWidth="2" />
                  <text x="150" y="445" fill="#22c55e" fontSize="10" fontWeight="bold" textAnchor="end">
                    Level 1 (±0.00)
                  </text>

                  {/* Pit Level */}
                  <line x1="160" y1="540" x2="220" y2="540" stroke="#ef4444" strokeWidth="2" />
                  <text x="150" y="545" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="end">
                    Pit Bottom (-{PD} mm)
                  </text>
                </g>

                {/* ================= VERTICAL DIMENSIONS ================= */}
                {showDimensions && (
                  <g id="vertical-dimensions">
                    {/* Overhead Dimension (Top landing to top ceiling) */}
                    <line x1="670" y1="70" x2="670" y2="180" stroke="#38bdf8" strokeWidth="1.2" markerStart="url(#arrow-start)" markerEnd="url(#arrow-end)" />
                    <text
                      x="680"
                      y="130"
                      fill="#0284c7"
                      fontSize="10"
                      fontWeight="bold"
                      className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                      onDoubleClick={() => handleOpenDimensionEditor('OH', 'الارتفاع العلوي للبئر', 'Overhead Height (OH)', OH)}
                    >
                      OH = {OH} mm ✎
                      <title>انقر مرتين لتعديل الارتفاع العلوي (Double click to edit Overhead)</title>
                    </text>

                    {/* Travel Height */}
                    <line x1="670" y1="180" x2="670" y2="440" stroke="#22c55e" strokeWidth="1.5" markerStart="url(#arrow-start)" markerEnd="url(#arrow-end)" />
                    <text
                      x="680"
                      y="315"
                      fill="#22c55e"
                      fontSize="11"
                      fontWeight="bold"
                      className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                      onDoubleClick={() => handleOpenDimensionEditor('TRAVEL', 'ارتفاع المشوار بالمتر', 'Travel Height', spec.travelHeightM, 'm')}
                    >
                      Travel H = {spec.travelHeightM} m ({spec.stops} Stops) ✎
                      <title>انقر مرتين لتعديل ارتفاع المشوار (Double click to edit Travel Height)</title>
                    </text>

                    {/* Pit Depth */}
                    <line x1="670" y1="440" x2="670" y2="540" stroke="#ef4444" strokeWidth="1.2" markerStart="url(#arrow-start)" markerEnd="url(#arrow-end)" />
                    <text
                      x="680"
                      y="495"
                      fill="#ef4444"
                      fontSize="10"
                      fontWeight="bold"
                      className="cursor-pointer select-none hover:fill-amber-400 transition-colors"
                      onDoubleClick={() => handleOpenDimensionEditor('PD', 'عمق حفرة البئر', 'Pit Depth (PD)', PD)}
                    >
                      Pit PD = {PD} mm ✎
                      <title>انقر مرتين لتعديل عمق الحفرة (Double click to edit Pit Depth)</title>
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* ========================================================================= */}
            {/* VIEW 3: CABIN INTERIOR DETAIL (ARCHITECTURAL FINISHES)                    */}
            {/* ========================================================================= */}
            {viewMode === 'CABIN_INTERIOR' && (
              <g id="cad-cabin-interior">
                {/* 3D Isometric / Perspective Cabin Enclosure */}
                <g transform="translate(160, 50)">
                  {/* Rear Wall */}
                  <rect
                    x="80"
                    y="70"
                    width="440"
                    height="360"
                    fill={getWallFinishFill()}
                    stroke={getWallFinishStroke()}
                    strokeWidth="3"
                  />

                  {/* Rear Wall Panels & Vertical Seams */}
                  <line x1="226" y1="70" x2="226" y2="430" stroke={getWallFinishStroke()} strokeWidth="1.5" />
                  <line x1="373" y1="70" x2="373" y2="430" stroke={getWallFinishStroke()} strokeWidth="1.5" />

                  {/* Mirror Inset on Central Panel */}
                  <rect
                    x="240"
                    y="100"
                    width="120"
                    height="200"
                    fill="#e0f2fe"
                    fillOpacity="0.75"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                  <line x1="250" y1="120" x2="330" y2="280" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.6" />

                  {/* Ceiling with Selected Lighting Pattern */}
                  <polygon
                    points="0,0 600,0 520,70 80,70"
                    fill="#ffffff"
                    stroke="#94a3b8"
                    strokeWidth="2"
                  />
                  {/* Downlight Spotlights */}
                  <circle cx="200" cy="35" r="9" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                  <circle cx="300" cy="35" r="9" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                  <circle cx="400" cy="35" r="9" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                  {spec.ceilingStyle === 'INDIRECT_HALO_ACRYLIC' && (
                    <polygon
                      points="120,55 480,55 450,20 150,20"
                      fill="#0284c7"
                      fillOpacity="0.4"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Left Side Wall (Perspective Angle) */}
                  <polygon
                    points="0,0 80,70 80,430 0,510"
                    fill={getWallFinishFill()}
                    stroke={getWallFinishStroke()}
                    strokeWidth="2.5"
                  />

                  {/* Right Side Wall */}
                  <polygon
                    points="600,0 520,70 520,430 600,510"
                    fill={getWallFinishFill()}
                    stroke={getWallFinishStroke()}
                    strokeWidth="2.5"
                  />

                  {/* Car Operating Panel (COP) on Right Wall */}
                  <g transform="translate(535, 140)">
                    <rect x="0" y="0" width="45" height="240" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" rx="3" />
                    {/* TFT Display Screen */}
                    <rect x="5" y="8" width="35" height="40" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1" rx="2" />
                    <text x="22" y="32" fill="#2563eb" fontSize="16" fontWeight="bold" textAnchor="middle">
                      08
                    </text>
                    <polygon points="22,14 16,22 28,22" fill="#22c55e" />
                    {/* Button Array */}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <circle
                        key={i}
                        cx={14 + (i % 2) * 17}
                        cy={65 + Math.floor(i / 2) * 22}
                        r="6"
                        fill="#ffffff"
                        stroke="#f59e0b"
                        strokeWidth="1.2"
                      />
                    ))}
                    {/* Door Open / Close Buttons */}
                    <circle cx="14" cy="165" r="5" fill="#ffffff" stroke="#38bdf8" strokeWidth="1" />
                    <circle cx="31" cy="165" r="5" fill="#ffffff" stroke="#38bdf8" strokeWidth="1" />
                    {/* Emergency Alarm & Key */}
                    <circle cx="22" cy="190" r="7" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
                  </g>

                  {/* Floor Slab (Perspective Angle) */}
                  <polygon
                    points="0,510 80,430 520,430 600,510"
                    fill="#ffffff"
                    stroke="#94a3b8"
                    strokeWidth="2"
                  />

                  {/* Continuous Stainless Handrail */}
                  <path
                    d="M 50 330 L 80 300 L 520 300 L 550 330"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 50 330 L 80 300 L 520 300 L 550 330"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </g>

                {/* Finishes Specification Legend */}
                <g transform="translate(40, 595)">
                  <rect x="0" y="0" width="840" height="75" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" rx="4" />
                  <text x="15" y="24" fill="#0284c7" fontSize="11" fontWeight="bold">
                    CABIN ARCHITECTURAL INTERIOR SPECIFICATIONS
                  </text>
                  <text x="15" y="44" fill="#64748b" fontSize="10">
                    Wall Cladding: <tspan fill="#1e293b" fontWeight="bold">{spec.wallFinish.replace(/_/g, ' ')}</tspan>
                  </text>
                  <text x="15" y="60" fill="#64748b" fontSize="10">
                    Flooring: <tspan fill="#1e293b" fontWeight="bold">{spec.floorFinish.replace(/_/g, ' ')}</tspan>
                  </text>
                  <text x="320" y="44" fill="#64748b" fontSize="10">
                    Ceiling Lighting: <tspan fill="#1e293b" fontWeight="bold">{spec.ceilingStyle.replace(/_/g, ' ')}</tspan>
                  </text>
                  <text x="320" y="60" fill="#64748b" fontSize="10">
                    Handrail: <tspan fill="#1e293b" fontWeight="bold">{spec.handrailType.replace(/_/g, ' ')}</tspan>
                  </text>
                  <text x="610" y="44" fill="#64748b" fontSize="10">
                    COP Display: <tspan fill="#1e293b" fontWeight="bold">{spec.copDisplayType.replace(/_/g, ' ')}</tspan>
                  </text>
                  <text x="610" y="60" fill="#64748b" fontSize="10">
                    Ventilation: <tspan fill="#1e293b" fontWeight="bold">Concealed Cross-Flow Fan (320 m³/h)</tspan>
                  </text>
                </g>
              </g>
            )}

            {/* ================= CAD TITLE BLOCK (BOTTOM RIGHT) ================= */}
            <g id="cad-title-block" transform="translate(560, 580)">
              <rect x="0" y="0" width="340" height="95" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="0" y1="24" x2="340" y2="24" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="0" y1="48" x2="340" y2="48" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="0" y1="72" x2="340" y2="72" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="170" y1="24" x2="170" y2="95" stroke="#e2e8f0" strokeWidth="1" />

              <text x="10" y="16" fill="#0284c7" fontSize="10" fontWeight="bold">
                ELEVATOR ENGINEERING SPECIFICATION DRAWING
              </text>
              <text x="10" y="38" fill="#64748b" fontSize="9">
                PROJECT: <tspan fill="#1e293b" fontWeight="bold">{spec.projectName.slice(0, 24)}</tspan>
              </text>
              <text x="180" y="38" fill="#64748b" fontSize="9">
                REF: <tspan fill="#b45309" fontWeight="bold">{spec.quoteRef}</tspan>
              </text>
              <text x="10" y="62" fill="#64748b" fontSize="9">
                TYPE: <tspan fill="#1e293b" fontWeight="bold">{spec.elevatorType}</tspan>
              </text>
              <text x="180" y="62" fill="#64748b" fontSize="9">
                CODE: <tspan fill="#059669" fontWeight="bold">EN 81-20 / EN 81-50</tspan>
              </text>
              <text x="10" y="86" fill="#64748b" fontSize="9">
                DATE: <tspan fill="#1e293b" fontWeight="bold">{spec.date}</tspan>
              </text>
              <text x="180" y="86" fill="#64748b" fontSize="9">
                STATUS: <tspan fill="#2563eb" fontWeight="bold">{spec.status}</tspan>
              </text>
            </g>
          </svg>
        </div>
      </div>
    </>
  )}

      {/* Engineering Tolerance & Clearance Summary Footer */}
      <div className="bg-slate-50 border-t border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
          <div className="text-slate-500 font-medium">Headroom (OH)</div>
          <div className="text-base font-semibold text-slate-800 mt-0.5">
            {spec.overheadHeightMm} mm
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Req. min: {calc.recommendedOverhead} mm ({calc.isOverheadCompliant ? '✓ OK' : '⚠ Tight'})
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
          <div className="text-slate-500 font-medium">Pit Depth (PD)</div>
          <div className="text-base font-semibold text-slate-800 mt-0.5">
            {spec.pitDepthMm} mm
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Req. min: {calc.recommendedPitDepth} mm ({calc.isPitCompliant ? '✓ OK' : '⚠ Tight'})
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
          <div className="text-slate-500 font-medium">Drive Motor Power</div>
          <div className="text-base font-semibold text-blue-600 mt-0.5">
            {calc.motorPowerKw} kW
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Torque: {calc.motorTorqueNm} Nm ({spec.ropingRatio} roping)
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
          <div className="text-slate-500 font-medium">5-Min Handling Traffic</div>
          <div className="text-base font-semibold text-emerald-600 mt-0.5">
            {calc.fiveMinHandlingCapacityPpl} persons
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Round Trip: ~{calc.roundTripTimeSec}s
          </div>
        </div>
      </div>
    
      {/* Success Notification Banner */}
      {successNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-lg shadow-xl flex items-center gap-2.5 text-sm font-semibold animate-in slide-in-from-top duration-300">
          <CheckCircle className="w-5 h-5 text-white" />
          <span>{successNotice}</span>
          <button onClick={() => setSuccessNotice(null)} className="p-1 hover:bg-emerald-700 rounded transition-colors mr-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Double-Click Interactive Dimension Editor Modal */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    تعديل البُعد مباشرة (Edit Dimension)
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingField.labelAr} ({editingField.labelEn})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Constraints & Validation Rules Note */}
            <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs space-y-1.5 text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>شروط ومعايير التحقق الهندسي (EN 81-20):</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 text-slate-300 pr-1">
                <li>لا يمكن إدخال قيمة تتعدى مساحة البئر (SW × SD).</li>
                <li>يجب ترك خلوص أمان لا يقل عن <strong>30 مم</strong> قبل الحائط من جميع الجوانب.</li>
                <li>جهاز الباب (السنتر: كل 1 متر يحتاج 2.10 متر؛ والجانبي: كل 1 متر يحتاج 1.05 متر) باللون البرتقالي ملتصق بالباب الأزرق ولا يلامس أو يتعدى البئر.</li>
                <li>الخلوص بين الكابينة وثقل الموازنة لا يقل عن <strong>50 مم</strong>.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                القيمة الجديدة ({editingField.unit}):
              </label>
              <div className="relative">
                <input
                  type="number"
                  autoFocus
                  value={editInputValue}
                  onChange={(e) => {
                    setEditInputValue(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveDimension();
                    if (e.key === 'Escape') setEditingField(null);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-100 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base"
                  placeholder="أدخل القيمة بالمليمتر..."
                />
                <span className="absolute left-3 top-3 text-xs font-bold text-slate-400">
                  {editingField.unit}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                القيمة الحالية بالرسم: <strong className="text-slate-200">{editingField.currentValue} {editingField.unit}</strong>
              </p>
            </div>

            {/* Error Message Box */}
            {validationError && (
              <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200 flex items-start gap-2 animate-in shake duration-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>خطأ في القيمة المدخلة:</strong>
                  <div className="mt-0.5">{validationError}</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                إلغاء (Cancel)
              </button>
              <button
                type="button"
                onClick={handleSaveDimension}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                حفظ وتحديث الرسم فوراً
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              Default Drawing Sizes (إعدادات أبعاد وخلوصات الرسم الافتراضية)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">CWT Depth (mm)</label>
                <input
                  type="number"
                  value={settings?.drawingSettings?.cwtDepthMm || 250}
                  onChange={(e) => onUpdateSettings && settings && onUpdateSettings({ ...settings, drawingSettings: { ...settings.drawingSettings, cwtDepthMm: Number(e.target.value) } })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">CWT Width (mm)</label>
                <input
                  type="number"
                  value={settings?.drawingSettings?.cwtWidthMm || 800}
                  onChange={(e) => onUpdateSettings && settings && onUpdateSettings({ ...settings, drawingSettings: { ...settings.drawingSettings, cwtWidthMm: Number(e.target.value) } })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">CWT to Rear Gap (mm)</label>
                <input
                  type="number"
                  value={settings?.drawingSettings?.cwtToRearGapMm ?? 70}
                  onChange={(e) => onUpdateSettings && settings && onUpdateSettings({ ...settings, drawingSettings: { ...settings.drawingSettings, cwtToRearGapMm: Number(e.target.value) } })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Car to CWT Gap (mm)</label>
                <input
                  type="number"
                  value={settings?.drawingSettings?.carToCwtGapMm ?? 150}
                  onChange={(e) => onUpdateSettings && settings && onUpdateSettings({ ...settings, drawingSettings: { ...settings.drawingSettings, carToCwtGapMm: Number(e.target.value) } })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Front Sill Gap (mm)</label>
                <input
                  type="number"
                  value={settings?.drawingSettings?.frontSillGapMm || 100}
                  onChange={(e) => onUpdateSettings && settings && onUpdateSettings({ ...settings, drawingSettings: { ...settings.drawingSettings, frontSillGapMm: Number(e.target.value) } })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Door Operator Allowance / Gap (mm)</label>
                <input
                  type="number"
                  value={settings?.drawingSettings?.doorOperatorGapMm || 150}
                  onChange={(e) => onUpdateSettings && settings && onUpdateSettings({ ...settings, drawingSettings: { ...settings.drawingSettings, doorOperatorGapMm: Number(e.target.value) } })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  150 مم لجهاز الباب السنتر (+5 سم يمين ويسار)، أو 750 مم لفتحة 700 مم الجانبية
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Close & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
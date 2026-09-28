export type ElevatorType = 
  | 'MRL_TRACTION' 
  | 'GEARED_TRACTION' 
  | 'HYDRAULIC' 
  | 'PANORAMIC_GLASS' 
  | 'FREIGHT_HEAVY';

export type BuildingType = 
  | 'Residential' 
  | 'Commercial Office' 
  | 'Hospital / Healthcare' 
  | 'Hotel' 
  | 'Industrial' 
  | 'Luxury Villa';

export type CounterweightPosition = 'REAR' | 'SIDE_LEFT' | 'SIDE_RIGHT';

export type DoorType = 'CENTER_2P' | 'CENTER_4P' | 'SIDE_2P' | 'SIDE_3P';

export type WallFinish = 
  | 'BRUSHED_STEEL_304' 
  | 'MIRROR_ETCHED_GOLD' 
  | 'HAIRLINE_TITANIUM_BLACK' 
  | 'PANORAMIC_GLASS' 
  | 'WOOD_VENEER_LUXURY';

export type CeilingStyle = 
  | 'LED_DOWNLIGHTS_CUTOUT' 
  | 'INDIRECT_HALO_ACRYLIC' 
  | 'STAINLESS_MIRROR_SPOT';

export type FloorFinish = 
  | 'GRANITE_BLACK_GALAXY' 
  | 'PVC_MARBLE_EFFECT' 
  | 'CERAMIC_TILES' 
  | 'CHECKERED_STEEL_PLATE';

export type HandrailType = 
  | 'ROUND_BRUSHED_STAINLESS' 
  | 'FLAT_GOLD_TITANIUM' 
  | 'DUAL_ACCESSIBILITY_ADA' 
  | 'WOOD_STAINLESS_COMBO';

export type CopDisplayType = 
  | 'TFT_7_INCH_COLOR' 
  | 'DOT_MATRIX_BLUE' 
  | 'MULTIMEDIA_10_INCH_VIDEO' 
  | 'SEGMENT_RED';

export type ProjectStatus = 'Draft' | 'Sent' | 'Approved' | 'Won' | 'Installed' | 'Lost';

export type ProjectMilestoneKey = 'Engineering' | 'Manufacturing' | 'Shipping' | 'Installation';

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface ProjectMilestoneData {
  key: ProjectMilestoneKey;
  status: MilestoneStatus;
  targetDate?: string;
  completedDate?: string;
  notes?: string;
  progressPercent?: number; // 0 - 100%
  completedBy?: string;
}

export interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  createdAt: string;
  taxNumber?: string;
  customerType?: 'Corporate' | 'Individual' | 'Contractor' | 'Government';
  assignedSalesRepId?: string;
  assignedSalesRepName?: string;
}

export interface ElevatorSpecification {
  id: string;
  quoteRef: string;
  elevatorNumber?: string; // رقم كود المصعد (تركيب جديد، مثلاً INS-202609-001)
  projectName: string;
  clientName: string;
  customerId?: string;
  clientEmail: string;
  clientPhone: string;
  siteLocation: string;
  latitude?: number;
  longitude?: number;
  consultant: string;
  date: string;
  validityDays: number;
  status: ProjectStatus;

  // Sales Representative / Delegate
  assignedSalesRepId?: string;
  assignedSalesRepName?: string;
  assignedSalesRepPhone?: string;
  assignedSalesRepCommissionRate?: number;

  // Technical core
  elevatorType: ElevatorType;
  buildingType: BuildingType;
  capacityKg: number;
  personsCount: number;
  ratedSpeed: number;
  stops: number;
  openings: number;
  travelHeightM: number;
  floorToFloorM: number;
  ropingRatio: '1:1' | '2:1';
  counterweightPosition: CounterweightPosition;
  machineLocation: 'MRL_TOP' | 'OVERHEAD_ROOM' | 'BASEMENT_ROOM';
  powerSupply: string;

  // Shaft Dimensions (mm)
  shaftWidthMm: number;
  shaftDepthMm: number;
  pitDepthMm: number;
  overheadHeightMm: number;
  wallStructure: 'CONCRETE' | 'STEEL_FRAME_GLASS' | 'BRICK_MASONRY';

  // Cabin Dimensions (mm) & Door
  cabinWidthMm: number;
  cabinDepthMm: number;
  cabinHeightMm: number;
  doorType: DoorType;
  doorWidthMm: number;
  doorHeightMm: number;

  // Aesthetics & Interior
  wallFinish: WallFinish;
  ceilingStyle: CeilingStyle;
  floorFinish: FloorFinish;
  handrailType: HandrailType;
  copDisplayType: CopDisplayType;

  // Safety & Optional Systems
  automaticRescueDeviceARD: boolean;
  regenerativeDriveUnit: boolean;
  firemanServiceEN8172: boolean;
  seismicSensorEN8177: boolean;
  voiceSynthesizer: boolean;
  airPurifierSterilizer: boolean;
  accessControlCardReader: boolean;
  cctvShaftCabling: boolean;

  // Commercial & Financials
  baseEquipmentCost: number;
  finishesAddonCost: number;
  optionsAddonCost: number;
  installationCommissioningCost: number;
  shippingFreightCost: number;
  subtotalCost: number;

  // Dynamic Material Cost Indexes (1.0 = nominal, 1.2 = +20%)
  steelPriceIndexFactor: number;
  copperPriceIndexFactor: number;
  electronicsPriceIndexFactor: number;

  markupPercentage: number;
  discountPercentage: number;
  taxPercentage: number;
  totalQuotationPrice: number;
  grossProfit: number;
  grossMarginPercent: number;

  paymentTerms: string;
  warrantyMonths: number;
  deliveryWeeks: number;
  notes: string;

  // Project Timeline Milestones Tracking ('Engineering', 'Manufacturing', 'Shipping', 'Installation')
  currentMilestone?: ProjectMilestoneKey;
  projectMilestones?: Partial<Record<ProjectMilestoneKey, ProjectMilestoneData>>;

  // Site Delivery Tracking
  deliveredComponentIds?: string[];
  siteDeliveryRecords?: Record<string, {
    deliveredAt: string;
    receivedBy?: string;
    deliveryNoteNumber?: string;
  }>;

  // CAD Drawing Custom Margin Adjustments (mm)
  cabinFrontSillOffsetMm?: number; // Front sill running clearance (standard: 30mm)
  cabinRearOffsetMm?: number; // Custom rear clearance offset
  cabinSideOffsetMm?: number; // Custom horizontal offset
  counterweightWidthMm?: number; // Custom counterweight width in mm
  counterweightDepthMm?: number; // Custom counterweight depth in mm
}

export type ComponentCategory = 
  | 'TRACTION_DRIVE' 
  | 'CONTROL_ELECTRICAL' 
  | 'CAR_STRUCTURE' 
  | 'CAR_INTERIOR' 
  | 'DOORS_ENTRANCES' 
  | 'GUIDE_RAILS' 
  | 'ROPING_PULLEYS' 
  | 'SAFETY_EQUIPMENT' 
  | 'PIT_EQUIPMENT' 
  | 'INSTALLATION_LABOR';

export interface ComponentItem {
  id: string;
  category: ComponentCategory;
  name: string;
  specification: string;
  quantity: number;
  unit: string;
  unitCost: number;
  materialIndexType: 'STEEL' | 'COPPER' | 'ELECTRONICS' | 'GENERAL';
  totalCost: number;
  supplier: string;
  leadTimeDays: number;
  isDeliveredToSite?: boolean;
  deliveredToSiteAt?: string;
  deliveredByNoteNumber?: string;
}

export interface ShaftCalculations {
  recommendedShaftWidth: number;
  recommendedShaftDepth: number;
  recommendedPitDepth: number;
  recommendedOverhead: number;
  isShaftWidthCompliant: boolean;
  isShaftDepthCompliant: boolean;
  isPitCompliant: boolean;
  isOverheadCompliant: boolean;
  carGuideRailType: string;
  cwtGuideRailType: string;
  motorPowerKw: number;
  motorTorqueNm: number;
  mainRopesCountAndDia: string;
  bufferType: string;
  fiveMinHandlingCapacityPpl: number;
  roundTripTimeSec: number;
  carToShaftFrontClearance: number;
  carToShaftSideClearance: number;
  carToCwtClearance: number;
  cwtToWallClearance: number;
  dbgRailGaugeMm: number; // Distance between guide rails
  cwtDbgRailGaugeMm: number;
}

export interface MaterialCostBenchmark {
  date: string;
  steelPricePerTonUsd: number;
  copperPricePerKgUsd: number;
  electronicsChipIndex: number; // base 100
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  lastSyncedAt?: string;
  isConnected: boolean;
}

// ==========================================
// 3-STAGE DISBURSEMENT STATEMENT (بيان مقرر الصرف)
// ==========================================
export interface DisbursementItem {
  seq: number; // م (1..62)
  nameAr: string; // البضاعة المطلوبة للموقع
  nameEn?: string;
  unitAr: string; // الوحدة (عامود 5 متر، حبة، طقم، كجم، متر، لفة)
  unitEn?: string;
  quantity: number; // الكمية
  unitPriceSar: number; // السعر الإفرادي بالريال
  totalPriceSar: number; // إجمالي الصرف بالريال
  notesAr: string; // ملاحظات (أبعاد، مواصفات خاصة)
  stageId: 1 | 2 | 3;
  isDeliveredToSite?: boolean; // علامة تم التوريد للموقع
  deliveredAt?: string; // تاريخ ووقت التوريد للموقع
  deliveredNoteRef?: string; // رقم سند أو إيصال التوريد
}

export interface DisbursementStageData {
  stageId: 1 | 2 | 3;
  stageNameAr: string;
  stageNameEn: string;
  stageDescriptionAr: string;
  stageDescriptionEn: string;
  items: DisbursementItem[];
  subtotalSar: number;
}

export interface DisbursementStatement {
  docRef: string; // e.g. BUY-24/1
  date: string; // 2026-9-8
  clientName: string; // مصطفى
  contractRef: string;
  address: string;
  stopsCount: number; // 4
  machineTypeAr: string; // جيرلس / جير بغرفة
  capacityKg: number; // 450
  elevatorOriginAr: string; // صيني
  doorSpecAr: string; // 70 سنتر
  controlSpecAr: string; // حسب حمولة المصعد الكهرباء 380 فولت | وحدة تحكم مع منظم سرعة | جهاز طوارئ
  carDoorSpecAr: string; // 70 سنتر | صيني | العدد 1 | استيل فضي مطفي
  landingDoorSpecAr: string; // 70 سنتر | صيني | العدد 4 | ديكور الباب الأرضي: استيل فضي هيرلاين لامع | ديكور الأبواب الخارجية: استيل فضي هيرلاين لامع
  cabinDecorSpecAr: string; // استيل فضي مطفي
  stages: DisbursementStageData[];
  totalCostSar: number;
}

export type CheckpointStatus = 'PASS' | 'ATTENTION' | 'DEFECT' | 'NA';

export type CheckpointCategory = 
  | 'MACHINE_ROOM'      // غرفة المحرك والماكينة
  | 'CAR_AND_TOP'       // الصاعدة وسقف الكابينة
  | 'DOORS_LANDING'     // الأبواب والمداخل
  | 'HOISTWAY_PIT'      // بئر المصعد والحفرة
  | 'SAFETY_DEVICES';   // أنظمة الأمان والإنقاذ

export interface AttachedPhoto {
  id: string;
  dataUrl: string;
  caption: string;
  timestamp: string;
  category?: string;
  checkpointId?: string;
}

export interface CheckpointItem {
  id: string;
  code: string; // e.g. "SBC-01"
  category: CheckpointCategory;
  categoryTitleAr: string;
  categoryTitleEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  standardReference: string; // e.g. "SBC 801 - Sec 6.3"
  isCritical: boolean; // if defective, requires immediate elevator shutdown or urgent action
  status: CheckpointStatus;
  notes: string;
  photos: AttachedPhoto[];
}

export interface Sbc801InspectionReport {
  id: string;
  reportNumber: string;
  contractId?: string;
  elevatorId: string;
  elevatorName: string;
  buildingName: string;
  customerName: string;
  customerPhone?: string;
  siteAddress?: string;
  technicianId: string;
  technicianName: string;
  inspectionDate: string;
  inspectionTime: string;
  checkpoints: CheckpointItem[];
  overallResult: 'APPROVED' | 'CONDITIONAL' | 'FAILED';
  scorePercentage: number;
  criticalDefectsCount: number;
  generalNotes: string;
  sparePartsRecommended: {
    partName: string;
    quantity: number;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    notes: string;
  }[];
  technicianSignature?: string;
  customerSignature?: string;
  customerRepresentativeName?: string;
  isSynced: boolean;
  isOfflineCreated: boolean;
  createdAt: string;
  syncedAt?: string;
  latitude?: number;
  longitude?: number;
}

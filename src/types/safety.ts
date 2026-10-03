export type CertificateStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING_INSPECTION';

export type InspectionTestResult = 'PASS' | 'FAIL' | 'NEEDS_ATTENTION' | 'NA';

export interface SafetyChecklistResults {
  // 1. Overspeed & Safety Gear
  overspeedGovernorTest: InspectionTestResult;
  safetyGearDropTest: InspectionTestResult;
  carBufferAndClearance: InspectionTestResult;
  counterweightBufferAndClearance: InspectionTestResult;
  
  // 2. Machine & Traction
  machineBrakeTorqueAndHolding: InspectionTestResult;
  tractionSheaveAndRopesWear: InspectionTestResult;
  machineRoomVentilationAndLighting: InspectionTestResult;
  
  // 3. Doors & Shaft Safety
  carDoorInterlockAndLightCurtain: InspectionTestResult;
  landingDoorLocksAndEmergencyRelease: InspectionTestResult;
  pitEmergencyStopSwitch: InspectionTestResult;
  carTopInspectionStationAndStop: InspectionTestResult;
  
  // 4. Emergency & Electrical
  automaticRescueDeviceArd: InspectionTestResult;
  emergencyCabinLightingAndAlarm: InspectionTestResult;
  intercomAndTelephoneSystem: InspectionTestResult;
  firefightersControlReturnPhase: InspectionTestResult;
}

export interface SafetyCertificate {
  id: string;
  certificateNumber: string;        // e.g. "CERT-CIVIL-2026-0089"
  licenseNumber?: string;           // رقم ترخيص السلامة / الدفاع المدني
  
  // Site & Elevator identification
  elevatorName: string;             // e.g. "مصعد الركاب الرئيسي - برج الأندلس"
  elevatorNumber: string;           // كود المصعد e.g. "LIFT-RDH-04"
  buildingName: string;             // e.g. "برج الأندلس التجاري"
  siteLocation: string;             // e.g. "الرياض - حي الملز - طريق الملك فهد"
  latitude?: number;
  longitude?: number;
  
  // Customer
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  
  // Elevator Technical specs
  elevatorType: string;             // e.g. "MRL Traction Gearless"
  capacityKg: number;               // 630 kg
  personsCount: number;             // 8 persons
  speedMps: number;                 // 1.0 m/s
  stopsCount: number;               // 6 stops
  manufacturer?: string;            // Twins / Sicor
  installationYear?: number;
  
  // Dates & Validity
  issueDate: string;                // YYYY-MM-DD
  expiryDate: string;               // YYYY-MM-DD (typically 1 year from issue)
  status: CertificateStatus;
  
  // Inspection Engineer & Authority
  inspectorEngineerName: string;
  inspectorLicenseNumber: string;   // رقم الاعتماد الهندسي
  civilDefenseApprovedCode?: string;// رمز اعتماد الدفاع المدني
  standardsCompliance: string;      // e.g. "SASO EN 81-20 / كود البناء السعودي العام SBC 801"
  
  // Checklist
  checklist: SafetyChecklistResults;
  
  // Remarks & Signatures
  inspectorNotes?: string;
  requiredCorrections?: string;     // ملاحظات التصحيح قبل التجديد
  companyOfficialSignature?: string;
  clientAcknowledgedBy?: string;
  createdAt: string;
}

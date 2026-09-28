import { ElevatorSpecification, ShaftCalculations } from '../types/elevator';

export interface StandardCarDimension {
  capacityKg: number;
  persons: number;
  carWidthMm: number;
  carDepthMm: number;
  carHeightMm: number;
  doorWidthMm: number;
  doorHeightMm: number;
  minShaftWidthRearCwt: number;
  minShaftDepthRearCwt: number;
  minShaftWidthSideCwt: number;
  minShaftDepthSideCwt: number;
}

export const STANDARD_LOAD_LOOKUP: Record<number, StandardCarDimension> = {
  320: {
    capacityKg: 320,
    persons: 4,
    carWidthMm: 900,
    carDepthMm: 1000,
    carHeightMm: 2200,
    doorWidthMm: 750,
    doorHeightMm: 2000,
    minShaftWidthRearCwt: 1450,
    minShaftDepthRearCwt: 1550,
    minShaftWidthSideCwt: 1650,
    minShaftDepthSideCwt: 1350,
  },
  450: {
    capacityKg: 450,
    persons: 6,
    carWidthMm: 1000,
    carDepthMm: 1250,
    carHeightMm: 2200,
    doorWidthMm: 800,
    doorHeightMm: 2100,
    minShaftWidthRearCwt: 1550,
    minShaftDepthRearCwt: 1750,
    minShaftWidthSideCwt: 1750,
    minShaftDepthSideCwt: 1550,
  },
  630: {
    capacityKg: 630,
    persons: 8,
    carWidthMm: 1100,
    carDepthMm: 1400,
    carHeightMm: 2200,
    doorWidthMm: 900,
    doorHeightMm: 2100,
    minShaftWidthRearCwt: 1650,
    minShaftDepthRearCwt: 1950,
    minShaftWidthSideCwt: 1850,
    minShaftDepthSideCwt: 1700,
  },
  800: {
    capacityKg: 800,
    persons: 10,
    carWidthMm: 1350,
    carDepthMm: 1400,
    carHeightMm: 2300,
    doorWidthMm: 900,
    doorHeightMm: 2100,
    minShaftWidthRearCwt: 1900,
    minShaftDepthRearCwt: 1950,
    minShaftWidthSideCwt: 2100,
    minShaftDepthSideCwt: 1700,
  },
  1000: {
    capacityKg: 1000,
    persons: 13,
    carWidthMm: 1600,
    carDepthMm: 1400,
    carHeightMm: 2300,
    doorWidthMm: 1000,
    doorHeightMm: 2100,
    minShaftWidthRearCwt: 2150,
    minShaftDepthRearCwt: 2000,
    minShaftWidthSideCwt: 2350,
    minShaftDepthSideCwt: 1750,
  },
  1275: {
    capacityKg: 1275,
    persons: 17,
    carWidthMm: 2000,
    carDepthMm: 1400,
    carHeightMm: 2400,
    doorWidthMm: 1100,
    doorHeightMm: 2100,
    minShaftWidthRearCwt: 2550,
    minShaftDepthRearCwt: 2050,
    minShaftWidthSideCwt: 2750,
    minShaftDepthSideCwt: 1800,
  },
  1600: {
    capacityKg: 1600,
    persons: 21,
    carWidthMm: 1400,
    carDepthMm: 2400,
    carHeightMm: 2400,
    doorWidthMm: 1200,
    doorHeightMm: 2100,
    minShaftWidthRearCwt: 2000,
    minShaftDepthRearCwt: 3000,
    minShaftWidthSideCwt: 2200,
    minShaftDepthSideCwt: 2750,
  },
  2000: {
    capacityKg: 2000,
    persons: 26,
    carWidthMm: 1500,
    carDepthMm: 2700,
    carHeightMm: 2500,
    doorWidthMm: 1300,
    doorHeightMm: 2200,
    minShaftWidthRearCwt: 2150,
    minShaftDepthRearCwt: 3350,
    minShaftWidthSideCwt: 2350,
    minShaftDepthSideCwt: 3050,
  },
  2500: {
    capacityKg: 2500,
    persons: 33,
    carWidthMm: 1800,
    carDepthMm: 2700,
    carHeightMm: 2600,
    doorWidthMm: 1500,
    doorHeightMm: 2200,
    minShaftWidthRearCwt: 2500,
    minShaftDepthRearCwt: 3400,
    minShaftWidthSideCwt: 2700,
    minShaftDepthSideCwt: 3100,
  },
};

export function calculateElevatorEngineering(spec: ElevatorSpecification): ShaftCalculations {
  const {
    capacityKg,
    ratedSpeed,
    shaftWidthMm,
    shaftDepthMm,
    pitDepthMm,
    overheadHeightMm,
    cabinWidthMm,
    cabinDepthMm,
    counterweightPosition,
    ropingRatio,
    stops,
    travelHeightM,
  } = spec;

  // 1. Minimum Overhead (Headroom) required based on rated speed (EN 81-20/50 standard)
  let recommendedOverhead = 3600;
  if (ratedSpeed > 1.0 && ratedSpeed <= 1.6) {
    recommendedOverhead = 3850;
  } else if (ratedSpeed > 1.6 && ratedSpeed <= 2.0) {
    recommendedOverhead = 4200;
  } else if (ratedSpeed > 2.0 && ratedSpeed <= 2.5) {
    recommendedOverhead = 4500;
  } else if (ratedSpeed > 2.5) {
    recommendedOverhead = 4900;
  }

  // 2. Minimum Pit Depth required based on rated speed
  let recommendedPitDepth = 1200;
  if (ratedSpeed > 1.0 && ratedSpeed <= 1.6) {
    recommendedPitDepth = 1450;
  } else if (ratedSpeed > 1.6 && ratedSpeed <= 2.0) {
    recommendedPitDepth = 1650;
  } else if (ratedSpeed > 2.0 && ratedSpeed <= 2.5) {
    recommendedPitDepth = 1950;
  } else if (ratedSpeed > 2.5) {
    recommendedPitDepth = 2300;
  }

  // 3. Recommended Shaft Width & Depth based on Car Size & CWT
  let recommendedShaftWidth = 0;
  let recommendedShaftDepth = 0;

  const isSideDoorType = spec.doorType?.toUpperCase().includes('SIDE');
  const standardSillGapMm = isSideDoorType ? 150 : 100;

  const cwtPos = counterweightPosition || 'REAR';

  if (cwtPos === 'REAR') {
    // Car + guide rail brackets on each side (200mm each)
    recommendedShaftWidth = cabinWidthMm + 550;
    // Car + door sill front space (100mm for Center / 150mm for Side) + CWT to rear (70mm) + CWT depth (250mm) + Car-to-CWT (150mm)
    recommendedShaftDepth = cabinDepthMm + 70 + 250 + 150 + standardSillGapMm;
  } else {
    // Side CWT
    recommendedShaftWidth = cabinWidthMm + 750;
    recommendedShaftDepth = cabinDepthMm + standardSillGapMm + 150;
  }

  // Compliance checks
  const isShaftWidthCompliant = shaftWidthMm >= recommendedShaftWidth;
  const isShaftDepthCompliant = shaftDepthMm >= recommendedShaftDepth;
  const isPitCompliant = pitDepthMm >= recommendedPitDepth;
  const isOverheadCompliant = overheadHeightMm >= recommendedOverhead;

  // 4. Guide rails selection
  let carGuideRailType = 'T89/B (Machined)';
  let cwtGuideRailType = 'T75-3/B (Cold Drawn)';
  if (capacityKg <= 450) {
    carGuideRailType = 'T75-3/B (Cold Drawn)';
    cwtGuideRailType = 'T50/A (Cold Drawn)';
  } else if (capacityKg >= 1000 && capacityKg < 1600) {
    carGuideRailType = 'T114/B or T125/B (Machined)';
    cwtGuideRailType = 'T75-3/B (Machined)';
  } else if (capacityKg >= 1600) {
    carGuideRailType = 'T127-2/B or T140-1/B';
    cwtGuideRailType = 'T89/B (Machined)';
  }

  // 5. Motor Power Calculation (kW)
  // P = (1 - balanceFactor) * Load * 9.81 * V / (1000 * efficiency)
  const balanceFactor = 0.47; // 47% counterweight counterbalance
  const netLiftLoad = capacityKg * (1 - balanceFactor);
  const mechanicalEfficiency = ropingRatio === '2:1' ? 0.82 : 0.86;
  const rawPowerKw = (netLiftLoad * 9.81 * ratedSpeed) / (1000 * mechanicalEfficiency);
  // Add 20% margin for acceleration torque and aerodynamic shaft losses
  const motorPowerKw = Math.max(3.2, Math.round(rawPowerKw * 1.25 * 10) / 10);
  const motorTorqueNm = Math.round((motorPowerKw * 9550) / Math.max(120, (ratedSpeed * 60) / 0.4));

  // 6. Roping & Pulley configuration
  let mainRopesCountAndDia = '5 x Ø10mm High-Tensile Steel Wire (Dual Tensile 1570/1770 N/mm²)';
  if (capacityKg <= 450) {
    mainRopesCountAndDia = '4 x Ø8mm Polyurethane Coated Steel Belts or 4 x Ø8mm Ropes';
  } else if (capacityKg >= 1000 && capacityKg < 1600) {
    mainRopesCountAndDia = '6 x Ø10mm High-Tensile Steel Wire Ropes';
  } else if (capacityKg >= 1600) {
    mainRopesCountAndDia = '8 x Ø12mm Special Traction Steel Ropes';
  }

  // 7. Buffer type
  const bufferType = ratedSpeed <= 1.0 
    ? 'Polyurethane Energy Accumulation Buffers with steel core' 
    : 'Oil Hydraulic Energy Dissipation Buffers with electric safety switch';

  // 8. Distance between guide rails (DBG)
  const dbgRailGaugeMm = cabinWidthMm + 160;
  const cwtDbgRailGaugeMm = cwtPos === 'REAR' ? 620 : 540;

  // 9. Clearances in mm
  const carToShaftFrontClearance = standardSillGapMm; // front sill clearance (100mm for CENTER, 150mm for SIDE)
  const carToShaftSideClearance = Math.max(20, Math.round((shaftWidthMm - cabinWidthMm) / 2));
  const carToCwtClearance = cwtPos === 'REAR' ? 150 : 75;
  const cwtToWallClearance = 70;

  // 10. Traffic handling calculation
  // Round trip time approximation
  const floorHeight = travelHeightM / Math.max(1, stops - 1);
  const doorCycleSec = 4.5;
  const transferTimeSec = 1.2;
  const probStops = Math.min(stops, Math.round(stops * 0.4 + 1.2));
  const runTimeSec = (travelHeightM / ratedSpeed) * 1.35;
  const roundTripTimeSec = Math.round(runTimeSec + probStops * (doorCycleSec + transferTimeSec * 2) + 12);
  const fiveMinHandlingCapacityPpl = Math.round((300 / roundTripTimeSec) * (spec.personsCount * 0.8));

  return {
    recommendedShaftWidth,
    recommendedShaftDepth,
    recommendedPitDepth,
    recommendedOverhead,
    isShaftWidthCompliant,
    isShaftDepthCompliant,
    isPitCompliant,
    isOverheadCompliant,
    carGuideRailType,
    cwtGuideRailType,
    motorPowerKw,
    motorTorqueNm,
    mainRopesCountAndDia,
    bufferType,
    fiveMinHandlingCapacityPpl,
    roundTripTimeSec,
    carToShaftFrontClearance,
    carToShaftSideClearance,
    carToCwtClearance,
    cwtToWallClearance,
    dbgRailGaugeMm,
    cwtDbgRailGaugeMm,
  };
}

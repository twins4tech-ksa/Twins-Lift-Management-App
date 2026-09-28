import { ComponentItem, ElevatorSpecification } from '../types/elevator';
import { calculateElevatorEngineering } from './elevatorCalculations';

export function generateComponentList(spec: ElevatorSpecification): ComponentItem[] {
  const engineering = calculateElevatorEngineering(spec);
  const stops = Math.max(2, spec.stops);
  const travelM = Math.max(3, spec.travelHeightM);
  const totalShaftHeightM = travelM + (spec.overheadHeightMm + spec.pitDepthMm) / 1000;
  
  // Material factors
  const steelFactor = spec.steelPriceIndexFactor || 1.0;
  const copperFactor = spec.copperPriceIndexFactor || 1.0;
  const elecFactor = spec.electronicsPriceIndexFactor || 1.0;

  // Rail lengths needed
  const railPairsCount = Math.ceil(totalShaftHeightM / 5); // 5m per rail
  const railBracketsCount = Math.ceil(totalShaftHeightM / 2.5) * 2; // every 2.5m for car + cwt

  const items: ComponentItem[] = [
    // 1. TRACTION DRIVE
    {
      id: 'COMP-DRV-01',
      category: 'TRACTION_DRIVE',
      name: spec.elevatorType === 'GEARED_TRACTION' 
        ? 'Geared Traction Hoist Machine' 
        : spec.elevatorType === 'HYDRAULIC'
        ? 'Submerged Hydraulic Power Unit & Ram'
        : 'PMSM Permanent Magnet Synchronous Gearless Machine',
      specification: `${engineering.motorPowerKw} kW, ${spec.ratedSpeed} m/s, ${spec.ropingRatio} Roping, ${engineering.motorTorqueNm} Nm torque, IP41 Class F`,
      quantity: 1,
      unit: 'set',
      unitCost: Math.round((3800 + spec.capacityKg * 2.2 + spec.ratedSpeed * 950) * (0.4 * steelFactor + 0.4 * copperFactor + 0.2)),
      materialIndexType: 'COPPER',
      totalCost: 0,
      supplier: 'Torin Drive / Ziehl-Abegg',
      leadTimeDays: 25,
    },
    {
      id: 'COMP-DRV-02',
      category: 'TRACTION_DRIVE',
      name: 'Heavy-Duty Machine Bedplate & Vibration Isolators',
      specification: 'Welded structural steel I-beam frame with dual-durometer rubber damping pads',
      quantity: 1,
      unit: 'set',
      unitCost: Math.round(650 * steelFactor),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Montanari Engineering',
      leadTimeDays: 14,
    },

    // 2. CONTROL & ELECTRICAL
    {
      id: 'COMP-CTL-01',
      category: 'CONTROL_ELECTRICAL',
      name: 'VVVF Microprocessor Integrated Control Cabinet',
      specification: `32-Bit Dual-CPU, Closed-Loop Vector Drive Inverter, CAN-bus communication, ${spec.powerSupply}`,
      quantity: 1,
      unit: 'set',
      unitCost: Math.round((2900 + stops * 55 + (spec.ratedSpeed > 1.6 ? 700 : 0)) * elecFactor),
      materialIndexType: 'ELECTRONICS',
      totalCost: 0,
      supplier: 'Monarch / STEP Electric',
      leadTimeDays: 20,
    },
    {
      id: 'COMP-CTL-02',
      category: 'CONTROL_ELECTRICAL',
      name: 'Traveling Multi-Core Flat Cable Assembly',
      specification: `Flexible flame-retardant traveling cable with 24 cores + 2 shielded twisted pairs + RG6 coax for CCTV`,
      quantity: Math.ceil(travelM * 1.3),
      unit: 'meters',
      unitCost: Math.round(18 * copperFactor),
      materialIndexType: 'COPPER',
      totalCost: 0,
      supplier: 'Draka Elevator Cable',
      leadTimeDays: 10,
    },
    {
      id: 'COMP-CTL-03',
      category: 'CONTROL_ELECTRICAL',
      name: 'Shaft Limit Switches & Magnetic Leveling Sensors',
      specification: 'Bi-stable magnetic induction switches, terminal slowdown limit switches & vanes',
      quantity: stops * 2 + 4,
      unit: 'pcs',
      unitCost: Math.round(35 * elecFactor),
      materialIndexType: 'ELECTRONICS',
      totalCost: 0,
      supplier: 'Schmersal Safety',
      leadTimeDays: 12,
    },
    {
      id: 'COMP-CTL-04',
      category: 'CONTROL_ELECTRICAL',
      name: 'Car Operating Panel (COP) & Landing Indicators (LOP)',
      specification: `${spec.copDisplayType.replace(/_/g, ' ')}, Full-height column COP with braille pushbuttons + ${stops} LOP wall units with directional arrows`,
      quantity: 1,
      unit: 'set',
      unitCost: Math.round((850 + stops * 95) * (0.6 * elecFactor + 0.4 * steelFactor)),
      materialIndexType: 'ELECTRONICS',
      totalCost: 0,
      supplier: 'BST Elevator Components',
      leadTimeDays: 15,
    },

    // 3. CAR STRUCTURE
    {
      id: 'COMP-CAR-01',
      category: 'CAR_STRUCTURE',
      name: 'Car Frame (Sling) & Safety Assembly',
      specification: `Rated for ${spec.capacityKg} kg, high-grade structural steel uprights, upper/lower crossheads`,
      quantity: 1,
      unit: 'set',
      unitCost: Math.round((1400 + spec.capacityKg * 0.8) * steelFactor),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Wittur Group',
      leadTimeDays: 21,
    },
    {
      id: 'COMP-CAR-02',
      category: 'CAR_STRUCTURE',
      name: 'Progressive Bi-Directional Safety Gear',
      specification: `EN 81-20 compliant, dual roller progressive wedge mechanism, calibrated for ${spec.ratedSpeed} m/s`,
      quantity: 1,
      unit: 'set',
      unitCost: Math.round(780 * steelFactor),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Dynatech Safety',
      leadTimeDays: 18,
    },
    {
      id: 'COMP-CAR-03',
      category: 'CAR_STRUCTURE',
      name: 'Heavy-Duty Car & Counterweight Guide Shoes',
      specification: spec.ratedSpeed >= 2.0 
        ? 'Precision 3-wheel spring-loaded roller guide shoes (150mm polyurethane wheels)' 
        : 'Cast steel sliding guide shoes with replaceable low-friction nylon inserts & oil lubricators',
      quantity: 8,
      unit: 'pcs',
      unitCost: spec.ratedSpeed >= 2.0 ? 160 : 45,
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Acla-Werke / ELSCO',
      leadTimeDays: 10,
    },
    {
      id: 'COMP-CAR-04',
      category: 'CAR_STRUCTURE',
      name: 'Electronic Load Weighing Device (Overload Sensor)',
      specification: 'Under-platform load cell array with 80%, 100%, and 110% overload relay triggers & audio alarm',
      quantity: 1,
      unit: 'set',
      unitCost: Math.round(380 * elecFactor),
      materialIndexType: 'ELECTRONICS',
      totalCost: 0,
      supplier: 'Mitec Controls',
      leadTimeDays: 10,
    },

    // 4. CAR INTERIOR & CABIN
    {
      id: 'COMP-INT-01',
      category: 'CAR_INTERIOR',
      name: 'Cabin Shell & Wall Panels',
      specification: `${spec.cabinWidthMm}W x ${spec.cabinDepthMm}D x ${spec.cabinHeightMm}H mm, Finish: ${spec.wallFinish.replace(/_/g, ' ')}`,
      quantity: 1,
      unit: 'set',
      unitCost: Math.round(
        (1600 + (spec.wallFinish === 'MIRROR_ETCHED_GOLD' ? 950 : spec.wallFinish === 'PANORAMIC_GLASS' ? 2400 : spec.wallFinish === 'WOOD_VENEER_LUXURY' ? 1200 : 400)) *
        (0.7 * steelFactor + 0.3)
      ),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Custom Craft Architectural Elevators',
      leadTimeDays: 20,
    },
    {
      id: 'COMP-INT-02',
      category: 'CAR_INTERIOR',
      name: 'Designer Ceiling with Integrated LED Lighting',
      specification: `Model: ${spec.ceilingStyle.replace(/_/g, ' ')}, concealed ventilation vents, energy-saving LED arrays`,
      quantity: 1,
      unit: 'set',
      unitCost: 520,
      materialIndexType: 'GENERAL',
      totalCost: 0,
      supplier: 'Lumiere Elevator Decor',
      leadTimeDays: 12,
    },
    {
      id: 'COMP-INT-03',
      category: 'CAR_INTERIOR',
      name: 'Flooring Finish',
      specification: `Material: ${spec.floorFinish.replace(/_/g, ' ')}, flush mounted with sound-deadening subfloor`,
      quantity: 1,
      unit: 'set',
      unitCost: spec.floorFinish === 'GRANITE_BLACK_GALAXY' ? 680 : spec.floorFinish === 'PVC_MARBLE_EFFECT' ? 320 : 450,
      materialIndexType: 'GENERAL',
      totalCost: 0,
      supplier: 'StoneTech Interiors',
      leadTimeDays: 10,
    },
    {
      id: 'COMP-INT-04',
      category: 'CAR_INTERIOR',
      name: 'Architectural Handrail & Kickplates',
      specification: `${spec.handrailType.replace(/_/g, ' ')}, mounted at 900mm height with heavy-duty backer plate`,
      quantity: 1,
      unit: 'set',
      unitCost: 260,
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'SteelArt Architectural',
      leadTimeDays: 8,
    },

    // 5. DOORS & ENTRANCES
    {
      id: 'COMP-DOR-01',
      category: 'DOORS_ENTRANCES',
      name: 'VVVF High-Speed Car Door Operator',
      specification: `${spec.doorType.replace(/_/g, ' ')}, ${spec.doorWidthMm}mm Clear Opening x ${spec.doorHeightMm}mm Height, AC synchronous frequency conversion`,
      quantity: 1,
      unit: 'set',
      unitCost: Math.round(1100 * (0.5 * steelFactor + 0.5 * elecFactor)),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Fermator / Wittur',
      leadTimeDays: 18,
    },
    {
      id: 'COMP-DOR-02',
      category: 'DOORS_ENTRANCES',
      name: 'Landing Door Mechanisms, Sills & Jambs',
      specification: `${stops} Entrances, ${spec.doorType.replace(/_/g, ' ')}, fire-rated EI 60 landing panels with aluminum extruded sills`,
      quantity: stops,
      unit: 'pcs',
      unitCost: Math.round((480 + (spec.wallFinish.includes('GOLD') ? 120 : 0)) * steelFactor),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Fermator Group',
      leadTimeDays: 20,
    },
    {
      id: 'COMP-DOR-03',
      category: 'DOORS_ENTRANCES',
      name: 'Infrared Multi-Beam Safety Light Curtain',
      specification: '128-beam infrared optical safety curtain, IP65 waterproof transmitter & receiver with chime',
      quantity: 1,
      unit: 'set',
      unitCost: Math.round(280 * elecFactor),
      materialIndexType: 'ELECTRONICS',
      totalCost: 0,
      supplier: 'WECO Optoelectronics',
      leadTimeDays: 7,
    },

    // 6. GUIDE RAILS & MOUNTING
    {
      id: 'COMP-RAIL-01',
      category: 'GUIDE_RAILS',
      name: `Car Guide Rails (${engineering.carGuideRailType})`,
      specification: `Machined T-profile cold-drawn rails, 5.0m lengths with machined tongue and groove ends`,
      quantity: railPairsCount * 2,
      unit: 'pcs',
      unitCost: Math.round(115 * steelFactor),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Savera / Marazzi Guide Rails',
      leadTimeDays: 14,
    },
    {
      id: 'COMP-RAIL-02',
      category: 'GUIDE_RAILS',
      name: `Counterweight Guide Rails (${engineering.cwtGuideRailType})`,
      specification: `Precision T-profile rails, 5.0m lengths, machined fishplates and connection bolts`,
      quantity: railPairsCount * 2,
      unit: 'pcs',
      unitCost: Math.round(75 * steelFactor),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Savera Guide Rails',
      leadTimeDays: 14,
    },
    {
      id: 'COMP-RAIL-03',
      category: 'GUIDE_RAILS',
      name: 'Adjustable Heavy-Duty Guide Rail Wall Brackets',
      specification: 'Cold-formed structural steel brackets with M16 chemical anchor bolt sets',
      quantity: railBracketsCount,
      unit: 'pcs',
      unitCost: Math.round(42 * steelFactor),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Standard Hardware Group',
      leadTimeDays: 10,
    },

    // 7. ROPING & SUSPENSION
    {
      id: 'COMP-ROP-01',
      category: 'ROPING_PULLEYS',
      name: 'High-Tensile Steel Wire Suspension Ropes',
      specification: engineering.mainRopesCountAndDia,
      quantity: Math.ceil(totalShaftHeightM * (spec.ropingRatio === '2:1' ? 2.3 : 1.2)),
      unit: 'meters',
      unitCost: Math.round(14 * steelFactor),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Gustav Wolf / Brugg Lifting',
      leadTimeDays: 14,
    },
    {
      id: 'COMP-ROP-02',
      category: 'ROPING_PULLEYS',
      name: 'Diverter Pulleys & Rope Hitch Equalizers',
      specification: 'Cast ductile iron rope sheaves with sealed bearing cartridges & spring rope sockets',
      quantity: 1,
      unit: 'set',
      unitCost: Math.round(580 * steelFactor),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Schwartz Sheaves',
      leadTimeDays: 12,
    },

    // 8. SAFETY EQUIPMENT & OPTIONS
    {
      id: 'COMP-SAF-01',
      category: 'SAFETY_EQUIPMENT',
      name: 'Bi-Directional Overspeed Governor & Tensioner',
      specification: `Centrifugal governor with electrical and mechanical trip switches calibrated to ${(spec.ratedSpeed * 1.25).toFixed(2)} m/s`,
      quantity: 1,
      unit: 'set',
      unitCost: Math.round(620 * (0.6 * steelFactor + 0.4 * elecFactor)),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Dynatech / Gervall',
      leadTimeDays: 14,
    },
    ...(spec.automaticRescueDeviceARD ? [{
      id: 'COMP-SAF-02',
      category: 'SAFETY_EQUIPMENT' as const,
      name: 'Automatic Rescue Device (ARD) Battery Backup',
      specification: 'Auto-leveling battery inverter system, delivers car to nearest floor & opens doors during power blackout',
      quantity: 1,
      unit: 'set',
      unitCost: Math.round(980 * elecFactor),
      materialIndexType: 'ELECTRONICS' as const,
      totalCost: 0,
      supplier: 'Santroll Power Controls',
      leadTimeDays: 10,
    }] : []),
    ...(spec.regenerativeDriveUnit ? [{
      id: 'COMP-SAF-03',
      category: 'SAFETY_EQUIPMENT' as const,
      name: 'Regenerative Power Feedback Module',
      specification: 'Feeds clean sinusoidal energy back into building electrical grid during regenerative descent/ascent',
      quantity: 1,
      unit: 'set',
      unitCost: Math.round(1350 * elecFactor),
      materialIndexType: 'ELECTRONICS' as const,
      totalCost: 0,
      supplier: 'Yaskawa Energy Matrix',
      leadTimeDays: 21,
    }] : []),
    ...(spec.firemanServiceEN8172 ? [{
      id: 'COMP-SAF-04',
      category: 'SAFETY_EQUIPMENT' as const,
      name: 'EN 81-72 Firefighters Priority Control Package',
      specification: 'Key switch, intercom master, water protection seals & fire emergency dispatch logic',
      quantity: 1,
      unit: 'set',
      unitCost: 550,
      materialIndexType: 'ELECTRONICS' as const,
      totalCost: 0,
      supplier: 'BST Controls',
      leadTimeDays: 10,
    }] : []),
    ...(spec.seismicSensorEN8177 ? [{
      id: 'COMP-SAF-05',
      category: 'SAFETY_EQUIPMENT' as const,
      name: 'Tri-Axial Seismic P-Wave & S-Wave Detection Sensor',
      specification: 'EN 81-77 certified earthquake detector, triggers immediate safe stop at nearest landing',
      quantity: 1,
      unit: 'set',
      unitCost: 750,
      materialIndexType: 'ELECTRONICS' as const,
      totalCost: 0,
      supplier: 'SeismoTech Systems',
      leadTimeDays: 15,
    }] : []),

    // 9. PIT EQUIPMENT & COUNTERWEIGHT
    {
      id: 'COMP-PIT-01',
      category: 'PIT_EQUIPMENT',
      name: 'Heavy-Duty Car & Counterweight Buffers',
      specification: engineering.bufferType,
      quantity: 2,
      unit: 'set',
      unitCost: spec.ratedSpeed > 1.0 ? Math.round(620 * steelFactor) : Math.round(240 * steelFactor),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Acla / Henning Buffers',
      leadTimeDays: 14,
    },
    {
      id: 'COMP-PIT-02',
      category: 'PIT_EQUIPMENT',
      name: 'Counterweight Frame & Cast Iron Filler Blocks',
      specification: `Frame rated for car tare + ${(spec.capacityKg * 0.47).toFixed(0)} kg counter-balance weight blocks`,
      quantity: 1,
      unit: 'set',
      unitCost: Math.round((1100 + spec.capacityKg * 0.9) * steelFactor),
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'HeavyFoundry Castings',
      leadTimeDays: 16,
    },
    {
      id: 'COMP-PIT-03',
      category: 'PIT_EQUIPMENT',
      name: 'Pit Access Ladder & Maintenance Control Station',
      specification: 'Retractable galvanized steel safety ladder with interlock switch & pit stop station',
      quantity: 1,
      unit: 'set',
      unitCost: 290,
      materialIndexType: 'STEEL',
      totalCost: 0,
      supplier: 'Safework Elevators',
      leadTimeDays: 7,
    },

    // 10. INSTALLATION & LABOR
    {
      id: 'COMP-LBR-01',
      category: 'INSTALLATION_LABOR',
      name: 'Mechanical Installation & Guide Rail Alignment',
      specification: `Complete hoistway mechanical erection, laser plumb alignment, and motor placement (${stops} landings)`,
      quantity: stops * 8 + 32,
      unit: 'hours',
      unitCost: 55,
      materialIndexType: 'GENERAL',
      totalCost: 0,
      supplier: 'Certified Elevator Field Technicians',
      leadTimeDays: 14,
    },
    {
      id: 'COMP-LBR-02',
      category: 'INSTALLATION_LABOR',
      name: 'Electrical Cabling, Testing & Commissioning',
      specification: 'Controller parameter tuning, ride quality vibration analysis (ISO 18738), and full-load safety test',
      quantity: stops * 4 + 24,
      unit: 'hours',
      unitCost: 65,
      materialIndexType: 'GENERAL',
      totalCost: 0,
      supplier: 'Commissioning Engineering Team',
      leadTimeDays: 7,
    },
  ];

  // Calculate total costs per line
  return items.map((item) => ({
    ...item,
    totalCost: Math.round(item.unitCost * item.quantity),
  }));
}

export function calculateQuotationFinancials(spec: ElevatorSpecification, components: ComponentItem[]): {
  subtotalCost: number;
  markupAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalQuotationPrice: number;
  grossProfit: number;
  grossMarginPercent: number;
  costByCategory: Record<string, number>;
} {
  const subtotalCost = components.reduce((sum, item) => sum + item.totalCost, 0);
  
  const costByCategory: Record<string, number> = {};
  components.forEach((item) => {
    costByCategory[item.category] = (costByCategory[item.category] || 0) + item.totalCost;
  });

  const markupAmount = Math.round(subtotalCost * ((spec.markupPercentage || 25) / 100));
  const priceBeforeDiscount = subtotalCost + markupAmount;
  const discountAmount = Math.round(priceBeforeDiscount * ((spec.discountPercentage || 0) / 100));
  const netPrice = priceBeforeDiscount - discountAmount;
  const taxAmount = Math.round(netPrice * ((spec.taxPercentage || 10) / 100));
  const totalQuotationPrice = netPrice + taxAmount;
  const grossProfit = netPrice - subtotalCost;
  const grossMarginPercent = netPrice > 0 ? Math.round((grossProfit / netPrice) * 1000) / 10 : 0;

  return {
    subtotalCost,
    markupAmount,
    discountAmount,
    taxAmount,
    totalQuotationPrice,
    grossProfit,
    grossMarginPercent,
    costByCategory,
  };
}

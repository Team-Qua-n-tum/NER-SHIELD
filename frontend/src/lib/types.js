/**
 * NER-SHIELD Type Constants & Enums
 * For Smart Logistics & Accessibility Intelligence Platform — North Eastern Region (NER)
 */

export const CommodityPriority = {
  MEDICINE: 'MEDICINE',
  FOOD: 'FOOD',
  AGRICULTURAL: 'AGRICULTURAL',
  CONSTRUCTION: 'CONSTRUCTION',
  GENERAL: 'GENERAL',
};

export const CommodityMetadata = {
  [CommodityPriority.MEDICINE]: {
    label: 'Essential Medicines & Vaccines',
    icon: '💊',
    riskMultiplier: 3.5,
    criticality: 'CRITICAL',
    description: 'Ultra-sensitive medical supplies requiring lowest possible disruption risk.',
  },
  [CommodityPriority.FOOD]: {
    label: 'Emergency Food & Rations',
    icon: '🍞',
    riskMultiplier: 2.2,
    criticality: 'HIGH',
    description: 'Essential nutritional relief for flood/landslide isolated areas.',
  },
  [CommodityPriority.AGRICULTURAL]: {
    label: 'Perishable Agri Produce',
    icon: '🥬',
    riskMultiplier: 1.5,
    criticality: 'MODERATE',
    description: 'Time-critical regional produce prone to decay if delayed.',
  },
  [CommodityPriority.CONSTRUCTION]: {
    label: 'Heavy Construction & Repair Materials',
    icon: '🏗️',
    riskMultiplier: 1.0,
    criticality: 'STANDARD',
    description: 'Road repair gravel, Bailey bridge components, heavy earthmovers.',
  },
  [CommodityPriority.GENERAL]: {
    label: 'General Freight & Cargo',
    icon: '📦',
    riskMultiplier: 1.0,
    criticality: 'STANDARD',
    description: 'Standard consumer and commercial goods.',
  },
};

export const RoadStatus = {
  OPEN: 'OPEN',
  RESTRICTED: 'RESTRICTED',
  HIGH_RISK_WARNING: 'HIGH_RISK_WARNING',
  BLOCKED: 'BLOCKED',
};

export const SeverityLevel = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MODERATE: 'Moderate',
  LOW: 'Low',
};

export const IncidentType = {
  LANDSLIDE: 'Landslide',
  FLOOD: 'Flood',
  WEATHER: 'Weather',
  ROADWORK: 'Roadwork',
  ROAD_COLLAPSE: 'Road Collapse',
  TREE_FALL: 'Tree Fall',
  BRIDGE_DAMAGE: 'Bridge Damage',
};

export const DistrictAccessibility = {
  FULL_ACCESS: 'FULL_ACCESS',
  RESTRICTED: 'RESTRICTED',
  CRITICAL_BOTTLENECK: 'CRITICAL_BOTTLENECK',
  ISOLATED: 'ISOLATED',
};

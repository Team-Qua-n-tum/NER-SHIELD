/**
 * Realistic Northeast Districts Accessibility & Disaster Vulnerability Data
 */

export const districtsData = [
  {
    id: "dist-guwahati",
    name: "Kamrup Metropolitan (Guwahati)",
    state: "Assam",
    headquarters: "Guwahati",
    status: "OPTIMAL",
    accessibilityScore: 96,
    connectivityTrend: "+2%",
    vulnerabilityLevel: "Low",
    activeIncidentsCount: 0,
    criticalFacilities: ["Central Medical Cold Storage", "Refinery Depot", "Air Freight Hub"],
    assignedOfficer: "Inspector Debajit Barman",
    officerPhone: "+91 94351 88901",
    coordinates: [26.1445, 91.7362],
    primaryHighways: ["NH-27", "NH-17"],
    stockpileStatus: {
      foodGrainsDays: 45,
      medicalDays: 60,
      fuelDays: 30
    }
  },
  {
    id: "dist-shillong",
    name: "East Khasi Hills (Shillong)",
    state: "Meghalaya",
    headquarters: "Shillong",
    status: "MODERATE_RISK",
    accessibilityScore: 78,
    connectivityTrend: "-5%",
    vulnerabilityLevel: "Medium",
    activeIncidentsCount: 1,
    criticalFacilities: ["NEIGRIHMS Hospital Base", "State Food Warehouse"],
    assignedOfficer: "SDO P. Sangma",
    officerPhone: "+91 98622 33412",
    coordinates: [25.5788, 91.8933],
    primaryHighways: ["NH-6"],
    stockpileStatus: {
      foodGrainsDays: 28,
      medicalDays: 35,
      fuelDays: 20
    }
  },
  {
    id: "dist-dima-hasao",
    name: "Dima Hasao (Haflong)",
    state: "Assam",
    headquarters: "Haflong",
    status: "CRITICAL_BOTTLENECK",
    accessibilityScore: 32,
    connectivityTrend: "-28%",
    vulnerabilityLevel: "Extreme",
    activeIncidentsCount: 2,
    criticalFacilities: ["Haflong Civil Hospital", "BRO Emergency Staging Yard"],
    assignedOfficer: "Commander Joydev Nath",
    officerPhone: "+91 94353 77610",
    coordinates: [25.1764, 92.9566],
    primaryHighways: ["NH-6", "NH-27 (Bypass)"],
    stockpileStatus: {
      foodGrainsDays: 9,
      medicalDays: 6,
      fuelDays: 8
    }
  },
  {
    id: "dist-imphal",
    name: "Imphal West (Imphal)",
    state: "Manipur",
    headquarters: "Imphal",
    status: "ISOLATED",
    accessibilityScore: 48,
    connectivityTrend: "-12%",
    vulnerabilityLevel: "High",
    activeIncidentsCount: 1,
    criticalFacilities: ["RIMS Hospital Depot", "Imphal FCI Grain Silo"],
    assignedOfficer: "SDO L. Ibomcha Singh",
    officerPhone: "+91 98561 22998",
    coordinates: [24.8170, 93.9368],
    primaryHighways: ["NH-37", "NH-2", "NH-102"],
    stockpileStatus: {
      foodGrainsDays: 14,
      medicalDays: 8,
      fuelDays: 11
    }
  },
  {
    id: "dist-kohima",
    name: "Kohima & Dimapur Corridor",
    state: "Nagaland",
    headquarters: "Kohima",
    status: "RESTRICTED",
    accessibilityScore: 68,
    connectivityTrend: "+4%",
    vulnerabilityLevel: "Medium",
    activeIncidentsCount: 1,
    criticalFacilities: ["Naga Hospital Authority", "Dimapur Rail Freight Yard"],
    assignedOfficer: "Captain K. Sema",
    officerPhone: "+91 94364 11299",
    coordinates: [25.6751, 94.1086],
    primaryHighways: ["NH-29", "NH-2"],
    stockpileStatus: {
      foodGrainsDays: 22,
      medicalDays: 25,
      fuelDays: 18
    }
  },
  {
    id: "dist-aizawl",
    name: "Aizawl District",
    state: "Mizoram",
    headquarters: "Aizawl",
    status: "MODERATE_RISK",
    accessibilityScore: 74,
    connectivityTrend: "+1%",
    vulnerabilityLevel: "Medium",
    activeIncidentsCount: 1,
    criticalFacilities: ["Zoram Medical College", "State Civil Supply Depot"],
    assignedOfficer: "Superintendent Zothanmawia Ralte",
    officerPhone: "+91 98634 99120",
    coordinates: [23.7271, 92.7176],
    primaryHighways: ["NH-306", "NH-2"],
    stockpileStatus: {
      foodGrainsDays: 19,
      medicalDays: 21,
      fuelDays: 15
    }
  },
  {
    id: "dist-agartala",
    name: "West Tripura (Agartala)",
    state: "Tripura",
    headquarters: "Agartala",
    status: "OPTIMAL",
    accessibilityScore: 92,
    connectivityTrend: "+3%",
    vulnerabilityLevel: "Low",
    activeIncidentsCount: 0,
    criticalFacilities: ["Agartala Medical College", "FCI Railhead Silos", "IOCL Bulk Plant"],
    assignedOfficer: "Assistant Commissioner N. Debbarma",
    officerPhone: "+91 94363 44521",
    coordinates: [23.8315, 91.2868],
    primaryHighways: ["NH-8"],
    stockpileStatus: {
      foodGrainsDays: 35,
      medicalDays: 40,
      fuelDays: 25
    }
  },
  {
    id: "dist-tawang",
    name: "West Kameng & Tawang",
    state: "Arunachal Pradesh",
    headquarters: "Bomdila",
    status: "RESTRICTED",
    accessibilityScore: 54,
    connectivityTrend: "-8%",
    vulnerabilityLevel: "High",
    activeIncidentsCount: 1,
    criticalFacilities: ["Tawang Army & Civil Hospital", "BRO High Altitude Fuel Storage"],
    assignedOfficer: "Deputy Commissioner T. Norbu",
    officerPhone: "+91 94365 77800",
    coordinates: [27.5860, 91.8594],
    primaryHighways: ["NH-13", "Sela Tunnel Road"],
    stockpileStatus: {
      foodGrainsDays: 16,
      medicalDays: 12,
      fuelDays: 14
    }
  }
];

export default districtsData;

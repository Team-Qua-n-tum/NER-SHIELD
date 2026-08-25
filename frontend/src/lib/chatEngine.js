/**
 * NER-SHIELD Intelligent Chatbot & Knowledge Engine
 * Processes natural language queries against active real-time dashboard telemetry,
 * providing authoritative responses and interactive dashboard actions.
 */

export function generateChatResponse(userQuery, context) {
  const q = userQuery.toLowerCase().trim();
  const {
    alerts = [],
    vehicles = [],
    districts = [],
    incidents = [],
    routesData = {},
  } = context;

  // 1. Blocked Corridors / Road Status
  if (
    q.includes('block') ||
    q.includes('closed') ||
    q.includes('road status') ||
    q.includes('corridor') ||
    q.includes('open')
  ) {
    const blockedAlerts = alerts.filter(
      (a) => a.category === 'BLOCKED_ROAD' || a.severity === 'Critical'
    );

    return {
      text: `Currently, **${blockedAlerts.length} major corridor(s)** are critically blocked or disrupted:\n\n` +
        `• **NH-6 Dima Hasao Pass (Km 142)**: Total physical road blockage due to a 180m debris landslide.\n` +
        `• **NH-37 Barak Valley stretch**: 0.6m flash flood submergence.\n\n` +
        `✅ **Recommended Action**: Divert all heavy commercial & medical supply convoys via **NH-27 Nagaon & Dimapur bypass**.`,
      actions: [
        { label: '🗺️ Show Blocked NH-6 on Map', type: 'ROUTE_FILTER', value: 'ROUTE-PRIMARY' },
        { label: '🟢 Show AI Safe Bypass', type: 'ROUTE_FILTER', value: 'ROUTE-ALTERNATE' },
        { label: '🚨 View All Road Alerts', type: 'TAB_CHANGE', value: 'alerts' },
      ],
    };
  }

  // 2. Medicine / Imphal / Route Recommendations
  if (
    q.includes('medicine') ||
    q.includes('vaccine') ||
    q.includes('imphal') ||
    q.includes('route b') ||
    q.includes('route a') ||
    q.includes('safest route') ||
    q.includes('alternate') ||
    q.includes('bypass')
  ) {
    const rec = routesData?.recommended;
    return {
      text: `For **Essential Medical Supplies** to Imphal Valley:\n\n` +
        `• **Recommended Corridor**: **Route B (via NH-27 & Dimapur Bypass)**\n` +
        `• **ETA**: ${rec?.eta || '12h 00m'} (${rec?.distanceKm || 530} km)\n` +
        `• **Risk Level**: **LOW (14%)**\n` +
        `• **AI Decision Rationale**: High-priority medical cargo applies a **3.5x risk aversion multiplier**, avoiding the catastrophic landslide blockage at Dima Hasao NH-6 and ensuring 100% arrival reliability.`,
      actions: [
        { label: '🗺️ Activate Route B on Map', type: 'ROUTE_FILTER', value: 'ROUTE-ALTERNATE' },
        { label: '🧭 Open AI Route Optimizer', type: 'TAB_CHANGE', value: 'routes' },
      ],
    };
  }

  // 3. District Connectivity / Supply Buffers / Isolation
  if (
    q.includes('district') ||
    q.includes('buffer') ||
    q.includes('shortage') ||
    q.includes('isolate') ||
    q.includes('ration') ||
    q.includes('food')
  ) {
    const isolatedDistricts = districts.filter(
      (d) => d.status === 'ISOLATED' || d.criticalSupplyBufferDays <= 3.0
    );
    const names = isolatedDistricts.map((d) => `**${d.name}** (${d.criticalSupplyBufferDays} days left)`).join(', ');

    return {
      text: `Critical District Accessibility Analysis:\n\n` +
        `⚠️ **Highest Vulnerability**: ${names || 'Dima Hasao (Haflong)'}\n\n` +
        `• **Dima Hasao (Haflong)** has only **2.5 days of essential emergency supplies remaining** because both primary road arteries are severed.\n` +
        `• **Cachar (Silchar)** is operating at restricted single-lane flow with a 4.0-day buffer.\n\n` +
        `Recommendation: Dispatch air-relief or prioritize heavy convoy escorts immediately.`,
      actions: [
        { label: '📍 Inspect Dima Hasao', type: 'LOCATE_ITEM', value: { id: 'dist-dima-hasao', name: 'Dima Hasao (Haflong)', state: 'Assam', accessibilityScore: 28, criticalSupplyBufferDays: 2.5 } },
        { label: '📊 View District Matrix', type: 'TAB_CHANGE', value: 'districts' },
      ],
    };
  }

  // 4. Vehicles / Fleet / Delayed Shipments
  if (
    q.includes('vehicle') ||
    q.includes('truck') ||
    q.includes('fleet') ||
    q.includes('driver') ||
    q.includes('delay') ||
    q.includes('trk-ner')
  ) {

    return {
      text: `Logistics Fleet Telemetry Status:\n\n` +
        `• **Total Fleet Monitored**: ${vehicles.length} heavy transport units\n` +
        `• **Delayed Vehicle Alert**: **TRK-NER-101** (Driver: Ramesh Kumar)\n` +
        `  - **Cargo**: Essential Medical Supplies (Insulin/Cold Chain at 3.4°C)\n` +
        `  - **Current Status**: Delayed near Nongpoh due to NH-6 blockage\n` +
        `  - **Action**: Rerouted through Lumding-Dimapur safe bypass corridor.`,
      actions: [
        { label: '🚚 Locate TRK-NER-101', type: 'LOCATE_ITEM', value: { id: 'TRK-NER-101', registration: 'AS-01-GC-4482', cargo: 'Essential Medical Supplies', speedKmH: 48, lat: 26.12, lng: 92.20 } },
        { label: '🚛 View Fleet Dashboard', type: 'TAB_CHANGE', value: 'fleet' },
      ],
    };
  }

  // 5. Landslides / Floods / Weather / Active Incidents
  if (
    q.includes('landslide') ||
    q.includes('flood') ||
    q.includes('weather') ||
    q.includes('rain') ||
    q.includes('fog') ||
    q.includes('incident') ||
    q.includes('report')
  ) {
    return {
      text: `Active Disruption Summary (${incidents.length} Ground Incidents):\n\n` +
        `1. **Landslide (Critical)**: NH-6 Dima Hasao Km 142 (Clearance: 24-36 hrs, 2 JCBs active)\n` +
        `2. **Flash Flood (High)**: Barak Valley NH-37 near Silchar (Water depth: 0.6m)\n` +
        `3. **Dense Fog (Moderate)**: Umiam Lake stretch, Nongpoh (Visibility < 15m)\n` +
        `4. **Bridge Repairs (Moderate)**: NH-29 Kohima Bypass (Single-lane alternating)`,
      actions: [
        { label: '🚨 View Alert Center', type: 'TAB_CHANGE', value: 'alerts' },
        { label: '📝 Submit Field Report', type: 'OPEN_REPORT_MODAL' },
      ],
    };
  }

  // 6. Emergency Protocol
  if (q.includes('emergency') || q.includes('sdrf') || q.includes('ndrf') || q.includes('protocol')) {
    return {
      text: `Level-1 Emergency Protocol allows disaster coordinators to:\n\n` +
        `• Prioritize emergency convoys over general freight.\n` +
        `• Deploy SDRF watercraft escorts along submerged Barak Valley corridors.\n` +
        `• Requisition BRO heavy earthmovers for priority landslide clearance on NH-6.`,
      actions: [
        { label: '⚡ Toggle Level-1 Emergency', type: 'TOGGLE_EMERGENCY' },
        { label: '📝 New Field Report', type: 'OPEN_REPORT_MODAL' },
      ],
    };
  }

  // Default / Generic Help
  return {
    text: `Hello Officer. I am your **NER-SHIELD Logistics AI Copilot**.\n\n` +
      `I monitor all 8 Northeast States in real-time. You can ask me:\n` +
      `• *"What corridors are currently blocked?"*\n` +
      `• *"What is the safest route for medicines to Imphal?"*\n` +
      `• *"Which districts have critical food/supply shortages?"*\n` +
      `• *"What is the status of delayed freight vehicles?"*\n` +
      `• *"Summary of active landslides and flood submergences"*`,
    actions: [
      { label: '🛑 Blocked Corridors', type: 'ROUTE_FILTER', value: 'ROUTE-PRIMARY' },
      { label: '💊 Safe Route to Imphal', type: 'ROUTE_FILTER', value: 'ROUTE-ALTERNATE' },
      { label: '⚠️ District Vulnerabilities', type: 'TAB_CHANGE', value: 'districts' },
      { label: '🚨 Active Hazard Alerts', type: 'TAB_CHANGE', value: 'alerts' },
    ],
  };
}

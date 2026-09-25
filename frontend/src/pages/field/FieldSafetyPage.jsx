import React from 'react';
import { ShieldCheck, AlertTriangle, Radio, Phone, Flame, CloudRain, LifeBuoy } from 'lucide-react';

export const FieldSafetyPage = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span>Field Officer Safety SOP & Hazard Guidelines</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Standard operational protocols for high-monsoon landslide zones, active rockfalls, and flash flood crossings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <CloudRain className="w-5 h-5" />
            <span>Monsoon Landslide Response</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Never approach active rockfall zones or toe-slumps. Maintain minimum 150m standoff distance.
            Mark GPS coordinates from safe higher ground and place emergency flares to warn oncoming freight trucks.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Radio className="w-5 h-5" />
            <span>Dead-Zone Communications</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            When operating in Barapani or Dima Hasao cellular dead spots, maintain contact with base via satellite messenger
            or VHF Channel 16. Check in at designated physical road outposts every 90 minutes.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Flash Flood & Culvert Integrity</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Do not allow heavy freight convoys to cross submerged bridge decks. Inspect embankment erosion
            and transmit photographic evidence before authorizing emergency light-vehicle passage.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <LifeBuoy className="w-5 h-5" />
            <span>Emergency Escalation Protocol</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            For major lifeline corridor total blockages (&gt;12 hrs), immediately notify the District Disaster Management
            Authority (DDMA) and request regional BRO earth-moving machinery dispatch.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FieldSafetyPage;

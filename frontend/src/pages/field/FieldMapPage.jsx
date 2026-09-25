import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { OperationsMap } from '../../components/dashboard/OperationsMap';
import { Map, MapPin } from 'lucide-react';

export const FieldMapPage = () => {
  const { user } = useAuth();
  const districtLabel = user?.district_ids?.join(', ') || 'Patrol Sector';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Map className="w-6 h-6 text-indigo-400" />
          <span>Field Highway Patrol GIS Map</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>Assigned Patrol Sector: {districtLabel}</span>
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-2 shadow-2xl overflow-hidden">
        <OperationsMap height="680px" />
      </div>
    </div>
  );
};

export default FieldMapPage;

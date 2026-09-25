import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Truck,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  MapPin,
  Compass,
  Battery,
  Fuel,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  ChevronRight
} from 'lucide-react';

export const VehicleTable = ({ onLocateVehicle, onRerouteVehicle }) => {
  const {
    vehicles,
    drivers,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    assignDriverToVehicle
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cargoFilter, setCargoFilter] = useState('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [assigningDriverVehicle, setAssigningDriverVehicle] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: 'Heavy Freight Truck',
    cargo: '',
    cargoType: 'Medical',
    origin: 'Guwahati Hub (AS)',
    destination: 'Imphal Depot (MN)',
    capacityTonnes: 10,
    currentLoadTonnes: 8,
    route: 'NH-27 / NH-29 Safe Corridor',
    status: 'In Transit',
    driverId: '',
  });

  // Filtered List
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        v.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'IN_TRANSIT' && v.status.toLowerCase().includes('transit')) ||
        (statusFilter === 'DELAYED' && (v.status.toLowerCase().includes('delayed') || v.status.toLowerCase().includes('caution'))) ||
        (statusFilter === 'AVAILABLE' && v.status.toLowerCase().includes('available'));

      const matchCargo =
        cargoFilter === 'ALL' || v.cargoType?.toLowerCase() === cargoFilter.toLowerCase();

      return matchSearch && matchStatus && matchCargo;
    });
  }, [vehicles, searchTerm, statusFilter, cargoFilter]);

  const handleOpenAddModal = () => {
    setFormData({
      vehicleNumber: '',
      vehicleType: 'Heavy Freight Truck',
      cargo: 'Emergency Medical Resupply',
      cargoType: 'Medical',
      origin: 'Guwahati Central Depot',
      destination: 'Aizawl Civil Hospital (MZ)',
      capacityTonnes: 12,
      currentLoadTonnes: 9.5,
      route: 'NH-6 / NH-306 Corridor',
      status: 'In Transit',
      driverId: drivers[0]?.id || '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (veh) => {
    setEditingVehicle(veh);
    setFormData({
      vehicleNumber: veh.vehicleNumber,
      vehicleType: veh.vehicleType,
      cargo: veh.cargo,
      cargoType: veh.cargoType || 'General',
      origin: veh.origin,
      destination: veh.destination,
      capacityTonnes: veh.capacityTonnes || 10,
      currentLoadTonnes: veh.currentLoadTonnes || 8,
      route: veh.route || '',
      status: veh.status,
      driverId: veh.driverId || '',
    });
  };

  const handleSaveVehicle = (e) => {
    e.preventDefault();
    const assignedDriver = drivers.find((d) => d.id === formData.driverId);

    if (editingVehicle) {
      updateVehicle(editingVehicle.id, {
        ...formData,
        driverName: assignedDriver?.name || editingVehicle.driverName,
        driverPhone: assignedDriver?.phone || editingVehicle.driverPhone,
      });
      setEditingVehicle(null);
    } else {
      addVehicle({
        ...formData,
        driverName: assignedDriver?.name || 'Unassigned',
        driverPhone: assignedDriver?.phone || 'N/A',
      });
      setIsAddModalOpen(false);
    }
  };

  const handleAssignDriverSubmit = (e) => {
    e.preventDefault();
    if (assigningDriverVehicle && selectedDriverId) {
      assignDriverToVehicle(assigningDriverVehicle.id, selectedDriverId);
      setAssigningDriverVehicle(null);
      setSelectedDriverId('');
    }
  };

  const getStatusBadge = (status) => {
    if (status.includes('Delayed')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
    }
    if (status.includes('Caution') || status.includes('Fog')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
    }
    if (status.includes('Priority') || status.includes('Rerouting')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          <Compass className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
    }
    if (status.includes('Transit')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">
        {status}
      </span>
    );
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Table Header & Controls Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              NER Fleet Roster & Real-Time Tracking
            </h3>
            <p className="text-xs text-slate-400">
              Manage vehicles, assign drivers, monitor fuel & route telemetry across 8 Northeastern states.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Vehicle</span>
          </button>
        </div>

        {/* Search & Filter Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search vehicle number, driver, cargo, route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Filter: All Statuses ({vehicles.length})</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELAYED">Delayed / Caution</option>
              <option value="AVAILABLE">Available / Standby</option>
            </select>
          </div>

          {/* Cargo Filter */}
          <div className="relative">
            <select
              value={cargoFilter}
              onChange={(e) => setCargoFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Filter: All Cargo Categories</option>
              <option value="Medical">Medical Supplies</option>
              <option value="Cold Chain">Cold Chain / Vaccines</option>
              <option value="Fuel">Fuel & Petroleum</option>
              <option value="Food Grains">Food Grains (PDS)</option>
              <option value="Relief">Disaster Relief</option>
              <option value="Infrastructure">Infrastructure Materials</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Vehicle & Type</th>
              <th className="px-4 py-3 font-semibold">Assigned Driver</th>
              <th className="px-4 py-3 font-semibold">Cargo & Load</th>
              <th className="px-4 py-3 font-semibold">Route & Corridor</th>
              <th className="px-4 py-3 font-semibold">Telemetry (ETA / Fuel)</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                  No vehicles found matching criteria.
                </td>
              </tr>
            ) : (
              filteredVehicles.map((veh) => (
                <tr key={veh.id} className="hover:bg-slate-800/40 transition-colors group">
                  
                  {/* Vehicle & Type */}
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-white font-mono flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-400" />
                      {veh.vehicleNumber || veh.id}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{veh.vehicleType}</div>
                  </td>

                  {/* Driver */}
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-200">{veh.driverName || 'Unassigned'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{veh.driverPhone || 'N/A'}</div>
                  </td>

                  {/* Cargo */}
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-cyan-300">{veh.cargo}</div>
                    <div className="text-[11px] text-slate-400">
                      {veh.currentLoadTonnes}T / {veh.capacityTonnes}T capacity
                    </div>
                  </td>

                  {/* Route */}
                  <td className="px-4 py-3.5 max-w-xs">
                    <div className="truncate text-slate-200 font-medium">{veh.origin} → {veh.destination}</div>
                    <div className="text-[11px] text-blue-400 truncate mt-0.5">{veh.route || 'Standard Highway'}</div>
                  </td>

                  {/* Telemetry */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span className="font-mono text-slate-200 font-medium">ETA: {veh.eta || '3h 30m'}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-cyan-400" /> {veh.fuelPercent || 80}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Battery className="w-3 h-3 text-emerald-400" /> {veh.batteryPercent || 90}%
                      </span>
                      <span>{veh.speedKmH || 45} km/h</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    {getStatusBadge(veh.status)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      
                      {/* Locate on Map */}
                      <button
                        onClick={() => onLocateVehicle && onLocateVehicle(veh)}
                        title="Locate Vehicle on GIS Map"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/30 text-blue-400 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>

                      {/* Assign Driver */}
                      <button
                        onClick={() => {
                          setAssigningDriverVehicle(veh);
                          setSelectedDriverId(veh.driverId || '');
                        }}
                        title="Assign Driver"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEditModal(veh)}
                        title="Edit Vehicle Details"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/30 text-amber-400 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Decommission vehicle ${veh.vehicleNumber || veh.id}?`)) {
                            deleteVehicle(veh.id);
                          }
                        }}
                        title="Delete / Decommission Vehicle"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600/30 text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Vehicle Modal */}
      {(isAddModalOpen || editingVehicle) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                {editingVehicle ? 'Edit Vehicle Details' : 'Add Vehicle to NER Fleet'}
              </h4>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingVehicle(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Vehicle Registration #</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AS-01-GC-9921"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Vehicle Type</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Heavy Freight Truck">Heavy Freight Truck</option>
                    <option value="Refrigerated Container">Refrigerated Container</option>
                    <option value="Emergency Relief Van">Emergency Relief Van</option>
                    <option value="Fuel Tanker (High Octane)">Fuel Tanker (High Octane)</option>
                    <option value="4x4 Mountain Utility Truck">4x4 Mountain Utility Truck</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Cargo Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Medical Vaccines"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Cargo Category</label>
                  <select
                    value={formData.cargoType}
                    onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Medical">Medical</option>
                    <option value="Cold Chain">Cold Chain</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Food Grains">Food Grains</option>
                    <option value="Relief">Relief Kits</option>
                    <option value="Infrastructure">Infrastructure</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Origin Node</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Destination Node</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Assigned Driver</label>
                  <select
                    value={formData.driverId}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.state} - {d.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Operational Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="In Transit">In Transit</option>
                    <option value="Priority Rerouting">Priority Rerouting</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Available">Available / Standby</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Designated Highway Corridor</label>
                <input
                  type="text"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  placeholder="e.g. NH-27 Nagaon-Dimapur Safe Corridor"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingVehicle(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20"
                >
                  {editingVehicle ? 'Save Updates' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {assigningDriverVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Assign Driver to {assigningDriverVehicle.vehicleNumber}
              </h4>
              <button
                onClick={() => setAssigningDriverVehicle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignDriverSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Select Certified NER Logistics Driver:
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {drivers.map((drv) => (
                    <label
                      key={drv.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedDriverId === drv.id
                          ? 'bg-emerald-600/20 border-emerald-500/50 text-white'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="driverRadio"
                          value={drv.id}
                          checked={selectedDriverId === drv.id}
                          onChange={() => setSelectedDriverId(drv.id)}
                          className="text-emerald-500 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="font-bold text-white">{drv.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {drv.state} • {drv.specialization}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
                        {drv.rating} ★
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningDriverVehicle(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedDriverId}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default VehicleTable;

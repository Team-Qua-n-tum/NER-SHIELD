import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { vehiclesData as initialVehicles } from '../data/vehicles';
import { driversData as initialDrivers } from '../data/drivers';
import { officersData as initialOfficers } from '../data/officers';
import { incidentsData as initialIncidents } from '../data/incidents';
import { districtsData as initialDistricts } from '../data/districts';
import { mockAlerts, mockRouteRecommendations } from '../lib/mockData';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Auth & Role State (stored in localStorage)
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('ner_shield_role') || 'admin';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const savedRole = localStorage.getItem('ner_shield_role') || 'admin';
    return getUserForRole(savedRole);
  });

  function getUserForRole(role) {
    switch (role) {
      case 'driver':
        return {
          id: 'DRV-101',
          name: 'Ramesh Kumar',
          role: 'driver',
          roleLabel: 'Freight Convoy Captain',
          assignedVehicleId: 'VEH-101',
          vehicleNumber: 'AS-01-GC-4482',
          badge: 'Verified Driver',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        };
      case 'officer':
        return {
          id: 'L-OFF-201',
          name: 'Inspector Debajit Barman',
          role: 'officer',
          roleLabel: 'District Disaster Management Officer',
          district: 'Kamrup Metropolitan & Dima Hasao',
          badge: 'Field Clearance Officer',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        };
      case 'supply':
        return {
          id: 'SUP-501',
          name: 'N. Debbarma',
          role: 'supply',
          roleLabel: 'NER Supply & Freight Logistics Director',
          department: 'Civil Supplies & Emergency Stockpiles',
          badge: 'Supply Coordinator',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        };
      case 'admin':
      default:
        return {
          id: 'ADM-001',
          name: 'Col. Sanjeev Hazarika',
          role: 'admin',
          roleLabel: 'NER Logistics Command Director',
          department: 'Integrated Regional Command Center',
          badge: 'System Admin',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
        };
    }
  }

  const setRole = (role) => {
    localStorage.setItem('ner_shield_role', role);
    setCurrentRole(role);
    setCurrentUser(getUserForRole(role));
  };

  const logout = () => {
    localStorage.removeItem('ner_shield_role');
    setCurrentRole('admin');
    setCurrentUser(getUserForRole('admin'));
  };

  // Main State collections
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [officers, setOfficers] = useState(initialOfficers);
  const [incidents, setIncidents] = useState(initialIncidents);
  const [districts, setDistricts] = useState(initialDistricts);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [routesData, setRoutesData] = useState(mockRouteRecommendations);

  // Global Interactive States
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState('ROUTE-PRIMARY');
  const [inspectedItem, setInspectedItem] = useState(null);
  const [toast, setToast] = useState(null);

  // Communication & Chat State
  const [messages, setMessages] = useState([
    {
      id: 'MSG-1',
      sender: 'Commander Joydev Nath (BRO)',
      role: 'officer',
      text: 'Heavy machinery actively clearing debris on NH-6 Km 142. Estimated one-lane clearance in 14 hours.',
      timestamp: '10:14 AM',
      channel: 'Disaster Ops',
    },
    {
      id: 'MSG-2',
      sender: 'N. Debbarma (Supply Dept)',
      role: 'supply',
      text: 'Insulin and vaccine shipment VEH-101 has been rerouted via NH-27 Nagaon. Cold-chain battery is monitored.',
      timestamp: '10:22 AM',
      channel: 'Supply Ops',
    },
    {
      id: 'MSG-3',
      sender: 'Ramesh Kumar (Driver)',
      role: 'driver',
      text: 'Bypassing Lumding successfully. Road surface is clear, maintaining 48 km/h speed.',
      timestamp: '10:35 AM',
      channel: 'Driver Network',
    },
    {
      id: 'MSG-4',
      sender: 'NER-SHIELD AI Copilot',
      role: 'ai',
      text: 'Advisory: High rainfall expected around Umiam Lake from 13:00 to 17:00. Recommend reducing speed buffer for all container trucks on NH-6.',
      timestamp: '10:40 AM',
      channel: 'All Channels',
    },
  ]);

  // Toast Notification Trigger
  const showToast = useCallback((message, type = 'success', title = null) => {
    setToast({ message, type, title });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const closeToast = () => setToast(null);

  // Toggle Emergency Mode
  const toggleEmergencyMode = useCallback(() => {
    setEmergencyMode((prev) => {
      const next = !prev;
      if (next) {
        showToast(
          'Emergency Protocol Level-1 activated: High-priority relief corridors prioritized.',
          'warning',
          'EMERGENCY MODE ACTIVE'
        );
      } else {
        showToast('Emergency protocols stood down. Standard logistics operational status.', 'info');
      }
      return next;
    });
  }, [showToast]);

  // Vehicle Actions (Add / Edit / Delete / Assign Driver)
  const addVehicle = (newVehicle) => {
    const id = `VEH-${Date.now().toString().slice(-4)}`;
    const createdVehicle = {
      id,
      status: 'Available',
      healthStatus: 'Optimal',
      fuelPercent: 95,
      batteryPercent: 98,
      speedKmH: 0,
      distanceTravelledKm: 0,
      remainingDistanceKm: 100,
      totalDistanceKm: 100,
      coordinates: [26.14, 91.73],
      lastUpdate: 'Just now',
      ...newVehicle,
    };
    setVehicles((prev) => [createdVehicle, ...prev]);
    showToast(`Vehicle ${createdVehicle.vehicleNumber || id} added to NER fleet roster.`, 'success');
    return createdVehicle;
  };

  const updateVehicle = (id, updatedFields) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updatedFields, lastUpdate: 'Just now' } : v))
    );
    showToast(`Vehicle ${id} updated successfully.`, 'info');
  };

  const deleteVehicle = (id) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    showToast(`Vehicle ${id} decommissioned and removed from roster.`, 'warning');
  };

  const assignDriverToVehicle = (vehicleId, driverId) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) return;

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              driverId: driver.id,
              driverName: driver.name,
              driverPhone: driver.phone,
              lastUpdate: 'Just now',
            }
          : v
      )
    );

    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId
          ? {
              ...d,
              assignedVehicleId: vehicleId,
              status: 'On Duty',
            }
          : d
      )
    );

    showToast(`Driver ${driver.name} assigned to vehicle ${vehicleId}.`, 'success');
  };

  // Driver Actions
  const updateDriverStatus = (driverId, newStatus) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, status: newStatus } : d))
    );
    showToast(`Driver status changed to ${newStatus}.`, 'info');
  };

  // Incident Actions (Add, Verify, Update Road Status, Resolve)
  const addIncident = (newIncident) => {
    const id = `INC-${Date.now().toString().slice(-3)}`;
    const created = {
      id,
      reportedAt: 'Just now',
      verified: false,
      priorityLevel: newIncident.severity === 'Critical' ? 'Urgent P1' : 'High P2',
      ...newIncident,
    };

    setIncidents((prev) => [created, ...prev]);

    // Also push to active alerts
    const newAlert = {
      id: `ALT-${id}`,
      severity: created.severity || 'High',
      category: (created.category || 'BLOCKED_ROAD').toUpperCase(),
      title: created.title,
      location: created.location,
      state: created.state || 'Assam',
      time: 'Just now',
      timestamp: new Date().toISOString(),
      description: created.impact || 'New field incident reported.',
      impact: created.impact || 'Traffic movement disrupted.',
      recommendedAction: created.recommendedBypass || 'Exercise extreme caution.',
      affectedCommodities: created.affectedCommodities || ['GENERAL'],
      clearanceStatus: created.roadStatus || 'Under Assessment',
    };

    setAlerts((prev) => [newAlert, ...prev]);
    showToast(`New incident ${id} registered and broadcast to regional command.`, 'warning');
    return created;
  };

  const verifyIncident = (incidentId, officerName = 'Officer On Duty') => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? { ...inc, verified: true, verifiedBy: officerName, status: 'Verified' }
          : inc
      )
    );
    showToast(`Incident ${incidentId} officially verified.`, 'success');
  };

  const updateIncidentRoadStatus = (incidentId, roadStatus, clearanceEst = null) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              roadStatus,
              estimatedClearance: clearanceEst || inc.estimatedClearance,
            }
          : inc
      )
    );
    showToast(`Road status for ${incidentId} updated to: ${roadStatus}`, 'info');
  };

  // District Status Update
  const updateDistrictStatus = (districtId, newStatus, newScore = null) => {
    setDistricts((prev) =>
      prev.map((d) =>
        d.id === districtId
          ? {
              ...d,
              status: newStatus,
              accessibilityScore: newScore !== null ? newScore : d.accessibilityScore,
            }
          : d
      )
    );
    showToast(`District ${districtId} status updated to ${newStatus}.`, 'info');
  };

  // Chat Actions
  const sendMessage = (text, channel = 'All Channels', recipientRole = null) => {
    if (!text.trim()) return;
    const newMsg = {
      id: `MSG-${Date.now().toString().slice(-4)}`,
      sender: currentUser.name || 'User',
      role: currentRole,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel,
      recipientRole,
    };
    setMessages((prev) => [...prev, newMsg]);

    // Simulate AI Copilot reply if asking AI
    if (text.toLowerCase().includes('route') || text.toLowerCase().includes('ai') || text.toLowerCase().includes('weather') || text.toLowerCase().includes('nh-6')) {
      setTimeout(() => {
        const aiReply = {
          id: `MSG-AI-${Date.now().toString().slice(-4)}`,
          sender: 'NER-SHIELD AI Copilot',
          role: 'ai',
          text: `AI Telemetry Analysis for query: "${text}": Telemetry reports NH-27 alternate corridor running at 94% optimal efficiency. Landslide on NH-6 has 2 excavators active. Priority dispatch active.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel,
        };
        setMessages((prev) => [...prev, aiReply]);
      }, 900);
    }
  };

  const value = {
    currentRole,
    currentUser,
    setRole,
    logout,
    vehicles,
    drivers,
    officers,
    incidents,
    districts,
    alerts,
    routesData,
    emergencyMode,
    toggleEmergencyMode,
    selectedRouteId,
    setSelectedRouteId,
    inspectedItem,
    setInspectedItem,
    toast,
    showToast,
    closeToast,
    messages,
    sendMessage,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    assignDriverToVehicle,
    updateDriverStatus,
    addIncident,
    verifyIncident,
    updateIncidentRoadStatus,
    updateDistrictStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;

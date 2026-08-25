import { ApiClient } from './client';
import { mockIncidents } from '../mockData';

let localIncidents = [...mockIncidents];

export const incidentsApi = {
  async getIncidents() {
    return ApiClient.request(
      '/incidents',
      { method: 'GET' },
      () => ({
        total: localIncidents.length,
        incidents: localIncidents,
      })
    );
  },

  async reportIncident(reportData) {
    const newIncident = {
      id: `INC-00${localIncidents.length + 1}`,
      title: reportData.title || `${reportData.type} Incident Reported`,
      type: reportData.type || 'Landslide',
      severity: reportData.severity || 'High',
      location: reportData.location || 'NER Highway Corridor',
      district: reportData.district || 'Unspecified District',
      state: reportData.state || 'Assam',
      impact: reportData.impact || reportData.description || 'Road disruption reported by field official',
      estimatedClearance: reportData.estimatedClearance || 'Pending Assessment',
      reportedTime: 'Just now',
      verifiedBy: reportData.reportedBy ? `${reportData.reportedBy} (${reportData.department || 'Field Patrol'})` : 'Field Official (Mobile Dispatch)',
      coordinates: reportData.coordinates || [92.5, 25.5],
      activeResponse: 'Incident logged in State Emergency Operations Centre',
      photoUrl: reportData.photoUrl || null,
      status: 'PENDING_VERIFICATION',
      submittedAt: new Date().toISOString(),
    };

    localIncidents.unshift(newIncident);

    return ApiClient.request(
      '/incidents',
      {
        method: 'POST',
        body: JSON.stringify(reportData),
      },
      () => ({
        success: true,
        message: 'Field incident report submitted successfully.',
        incident: newIncident,
      })
    );
  },
};

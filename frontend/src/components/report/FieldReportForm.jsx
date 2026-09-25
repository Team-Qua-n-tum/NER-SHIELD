import React, { useState } from 'react';
import {
  FileText,
  MapPin,
  Camera,
  AlertTriangle,
  User,
  Phone,
  Building,
  CheckCircle2,
  X,
  Navigation,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { incidentsApi } from '../../lib/api/incidentsApi';
import { IncidentType } from '../../lib/types';

export const FieldReportForm = ({
  onSubmitSuccess,
  onCancel,
  initialData = {},
}) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    type: initialData.type || 'Landslide',
    severity: initialData.severity || 'High',
    state: initialData.state || 'Assam',
    district: initialData.district || 'Dima Hasao',
    location: initialData.location || '',
    lat: initialData.lat || '25.28',
    lng: initialData.lng || '92.85',
    description: initialData.description || '',
    estimatedClearance: initialData.estimatedClearance || '12 - 24 Hours',
    reportedBy: initialData.reportedBy || 'Officer R. Saikia',
    department: initialData.department || 'Border Roads Org (BRO) Patrol',
    contactNumber: initialData.contactNumber || '+91 94350-88776',
    photoUrl: initialData.photoUrl || null,
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gpsStatus, setGpsStatus] = useState('');

  const states = [
    'Assam',
    'Meghalaya',
    'Manipur',
    'Nagaland',
    'Arunachal Pradesh',
    'Mizoram',
    'Tripura',
    'Sikkim',
  ];

  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('GPS not supported on this device');
      return;
    }
    setGpsStatus('Acquiring satellite fix...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(4),
          lng: pos.coords.longitude.toFixed(4),
        }));
        setGpsStatus('GPS fix acquired (±5m)');
      },
      (_err) => {
        // Fallback default NER coordinate
        setFormData((prev) => ({ ...prev, lat: '25.8000', lng: '92.5000' }));
        setGpsStatus('Using regional default GPS (25.80°N, 92.50°E)');
      },
      { timeout: 5000 }
    );
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result);
        setFormData((prev) => ({ ...prev, photoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormData((prev) => ({ ...prev, photoUrl: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.location.trim()) {
      setErrorMsg('Please specify the exact road/corridor location or kilometer landmark.');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMsg('Please enter description notes of the disruption.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reportPayload = {
        title: formData.title || `${formData.type} at ${formData.location}`,
        type: formData.type,
        severity: formData.severity,
        district: formData.district,
        state: formData.state,
        location: formData.location,
        coordinates: [parseFloat(formData.lng) || 92.85, parseFloat(formData.lat) || 25.28],
        impact: formData.description,
        description: formData.description,
        estimatedClearance: formData.estimatedClearance,
        reportedBy: formData.reportedBy,
        department: formData.department,
        contactNumber: formData.contactNumber,
        photoUrl: formData.photoUrl,
      };

      const result = await incidentsApi.reportIncident(reportPayload);
      if (onSubmitSuccess) {
        onSubmitSuccess(result.incident || reportPayload);
      }
    } catch (err) {
      console.error('Failed to submit field report:', err);
      setErrorMsg('Submission error. Please check inputs and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="field-report-form-container">
      <div className="form-header-bar">
        <div className="form-title-group">
          <div className="form-title-icon-box">
            <FileText className="form-title-icon text-emerald" />
          </div>
          <div>
            <h3 className="form-title">NER Field Incident Reporting Interface</h3>
            <p className="form-subtitle">
              Instant hazard notification for Field Patrols, District DDMA, and Border Roads Organisation
            </p>
          </div>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="form-close-btn" aria-label="Close Form">
            <X className="close-icon" />
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="form-error-banner">
          <AlertTriangle className="error-icon" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="field-report-form">
        {/* Row 1: Incident Type & Severity */}
        <div className="form-row form-grid-2">
          <div className="form-field">
            <label className="field-label">Incident Disruption Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="form-select"
            >
              {Object.values(IncidentType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">Severity Level *</label>
            <div className="severity-pill-group">
              {['Critical', 'High', 'Moderate', 'Low'].map((sev) => {
                const isSelected = formData.severity === sev;
                return (
                  <button
                    type="button"
                    key={sev}
                    onClick={() => setFormData({ ...formData, severity: sev })}
                    className={`sev-pill sev-pill-${sev.toLowerCase()} ${
                      isSelected ? 'sev-pill-active' : ''
                    }`}
                  >
                    {sev}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: State & District */}
        <div className="form-row form-grid-2">
          <div className="form-field">
            <label className="field-label">State *</label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="form-select"
            >
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">District / Administrative Division *</label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="e.g. Dima Hasao, East Khasi Hills, Cachar..."
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Row 3: Specific Location & Landmark */}
        <div className="form-field">
          <label className="field-label">Corridor Location & Landmark Milepost *</label>
          <div className="input-with-icon">
            <MapPin className="field-icon text-rose" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. NH-6 Km 142 Dima Hasao Pass near Jatinga Junction"
              className="form-input with-left-icon"
              required
            />
          </div>
        </div>

        {/* Row 4: GPS Coordinates */}
        <div className="form-row form-grid-3">
          <div className="form-field">
            <label className="field-label">Latitude (°N)</label>
            <input
              type="text"
              value={formData.lat}
              onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
              placeholder="25.2800"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label className="field-label">Longitude (°E)</label>
            <input
              type="text"
              value={formData.lng}
              onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
              placeholder="92.8500"
              className="form-input"
            />
          </div>

          <div className="form-field button-align-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              icon={Navigation}
              onClick={handleUseCurrentGPS}
              className="gps-btn"
            >
              Get GPS Location
            </Button>
            {gpsStatus && <span className="gps-status-text">{gpsStatus}</span>}
          </div>
        </div>

        {/* Row 5: Description & Impact */}
        <div className="form-field">
          <label className="field-label">Disruption Description & Logistics Impact *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe debris size, water depth, single vs dual lane blockage, trapped vehicles, or immediate safety hazards..."
            rows={3}
            className="form-textarea"
            required
          />
        </div>

        {/* Row 6: Estimated Clearance Window */}
        <div className="form-field">
          <label className="field-label">Estimated Clearance Timeframe</label>
          <select
            value={formData.estimatedClearance}
            onChange={(e) => setFormData({ ...formData, estimatedClearance: e.target.value })}
            className="form-select"
          >
            <option value="1 - 2 Hours">1 - 2 Hours (Minor debris / quick clearance)</option>
            <option value="4 - 6 Hours">4 - 6 Hours (Moderate road obstruction)</option>
            <option value="12 - 24 Hours">12 - 24 Hours (Substantial landslide / flash flood)</option>
            <option value="24 - 36 Hours">24 - 36 Hours (Major rockfall / culvert washout)</option>
            <option value="48+ Hours">48+ Hours (Structural bridge repair / extensive breach)</option>
          </select>
        </div>

        {/* Row 7: Field Officer Verification */}
        <div className="form-row form-grid-3">
          <div className="form-field">
            <label className="field-label">Reporting Official</label>
            <div className="input-with-icon">
              <User className="field-icon" />
              <input
                type="text"
                value={formData.reportedBy}
                onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                className="form-input with-left-icon"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">Department / Agency</label>
            <div className="input-with-icon">
              <Building className="field-icon" />
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="form-input with-left-icon"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">Emergency Phone</label>
            <div className="input-with-icon">
              <Phone className="field-icon" />
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="form-input with-left-icon"
              />
            </div>
          </div>
        </div>

        {/* Row 8: Photo Upload / Evidence Attachment */}
        <div className="form-field">
          <label className="field-label">Photo / Drone Telemetry Attachment</label>
          <div className="photo-upload-container">
            {photoPreview ? (
              <div className="photo-preview-box">
                <img src={photoPreview} alt="Disruption evidence" className="preview-img" />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="remove-photo-btn"
                  aria-label="Remove photo"
                >
                  <X className="remove-icon" />
                </button>
              </div>
            ) : (
              <label className="photo-dropzone">
                <Camera className="dropzone-icon" />
                <span className="dropzone-text">
                  <strong>Click to capture / attach photo</strong> or drag and drop image file
                </span>
                <span className="dropzone-sub">Supports JPEG, PNG, Drone GeoTIFF snapshots</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden-file-input"
                />
              </label>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-footer-actions">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            icon={CheckCircle2}
            isLoading={isSubmitting}
            className="submit-report-btn"
          >
            Submit Ground Disruption Report
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FieldReportForm;

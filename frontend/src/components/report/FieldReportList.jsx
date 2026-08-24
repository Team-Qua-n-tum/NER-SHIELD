import React, { useState } from 'react';
import {
  FileText,
  MapPin,
  Camera,
  Clock,
  User,
  PlusCircle,
  ArrowUpRight,
  Search,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

export const FieldReportList = ({
  incidents = [],
  onOpenReportModal,
  onLocateIncident,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const filtered = incidents.filter((i) => {
    return (
      i.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Card
      title="Field Disruption Log & Ground Patrol Reports"
      subtitle="Submissions received from Border Roads Organisation, DDMA field officers, and police highway patrols"
      icon={FileText}
      action={
        <Button
          size="sm"
          variant="primary"
          icon={PlusCircle}
          onClick={onOpenReportModal}
        >
          New Field Report
        </Button>
      }
      className="field-reports-panel"
    >
      {/* Search Bar */}
      <div className="table-controls-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search incident reports by corridor, district, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="report-count-badge">
          <span>{filtered.length} Total Reports</span>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="reports-grid-container">
        {filtered.length === 0 ? (
          <EmptyState
            title="No Field Reports Found"
            description="No field incident reports match your search query."
          />
        ) : (
          filtered.map((report) => {
            const isCritical = report.severity === 'Critical';

            return (
              <div
                key={report.id}
                className={`field-report-card ${isCritical ? 'report-card-critical' : ''}`}
              >
                <div className="report-card-top">
                  <div className="report-badge-row">
                    <span className="report-id">{report.id}</span>
                    <Badge
                      variant={
                        report.severity === 'Critical'
                          ? 'critical'
                          : report.severity === 'High'
                          ? 'high'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {report.severity}
                    </Badge>
                    <Badge variant="default" size="sm">
                      {report.type}
                    </Badge>
                  </div>
                  <span className="report-time">{report.reportedTime}</span>
                </div>

                <h4 className="report-title">{report.title}</h4>

                <div className="report-location-row">
                  <MapPin className="location-icon text-rose" />
                  <span>
                    {report.location} ({report.district}, {report.state})
                  </span>
                </div>

                <p className="report-description">{report.impact || report.description}</p>

                {/* Photo Thumbnail if available */}
                {report.photoUrl && (
                  <div className="report-photo-thumb-container">
                    <img
                      src={report.photoUrl}
                      alt="Disruption evidence"
                      className="report-thumb-img"
                      onClick={() => setSelectedPhoto(report.photoUrl)}
                    />
                    <span className="thumb-label">
                      <Camera className="camera-icon" /> Attached Photo (Click to zoom)
                    </span>
                  </div>
                )}

                <div className="report-officer-row">
                  <div className="officer-info">
                    <User className="officer-icon" />
                    <span>{report.verifiedBy || 'Field Official'}</span>
                  </div>
                  <div className="clearance-tag">
                    <Clock className="clearance-icon" />
                    <span>Clearance: {report.estimatedClearance}</span>
                  </div>
                </div>

                <div className="report-card-footer">
                  <span className="status-label">
                    {report.activeResponse || 'Logged in Emergency Registry'}
                  </span>
                  {onLocateIncident && (
                    <Button
                      size="sm"
                      variant="outline"
                      iconRight={ArrowUpRight}
                      onClick={() => onLocateIncident(report)}
                    >
                      Locate on Map
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Photo Zoom Modal */}
      {selectedPhoto && (
        <div className="photo-modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto} alt="Zoomed report evidence" className="zoomed-photo" />
            <button className="photo-modal-close" onClick={() => setSelectedPhoto(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FieldReportList;

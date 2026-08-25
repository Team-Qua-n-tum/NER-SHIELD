import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FieldReportForm from '../../components/report/FieldReportForm';
import { incidentsApi } from '../../lib/api/incidentsApi';

// Mock the API
vi.mock('../../lib/api/incidentsApi', () => ({
  incidentsApi: {
    reportIncident: vi.fn(),
  },
}));

describe('FieldReportForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default values', () => {
    render(<FieldReportForm />);
    
    expect(screen.getByText('NER Field Incident Reporting Interface')).toBeInTheDocument();
    expect(screen.getByText(/Incident Disruption Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Severity Level/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const mockOnSubmitSuccess = vi.fn();
    incidentsApi.reportIncident.mockResolvedValueOnce({ incident: { id: 'test-123' } });

    render(<FieldReportForm onSubmitSuccess={mockOnSubmitSuccess} />);
    
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/e.g. NH-6 Km 142/i), {
      target: { value: 'Test Location' },
    });
    
    fireEvent.change(screen.getByPlaceholderText(/Describe debris size/i), {
      target: { value: 'Test Description' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Submit Ground Disruption Report'));

    await waitFor(() => {
      expect(incidentsApi.reportIncident).toHaveBeenCalledWith(expect.objectContaining({
        location: 'Test Location',
        description: 'Test Description',
      }));
      expect(mockOnSubmitSuccess).toHaveBeenCalled();
    });
  });

  it('shows error if required fields are missing', async () => {
    render(<FieldReportForm />);
    
    // Submit without filling anything
    fireEvent.click(screen.getByText('Submit Ground Disruption Report'));

    await waitFor(() => {
      expect(screen.getByText(/Please specify the exact road/i)).toBeInTheDocument();
      expect(incidentsApi.reportIncident).not.toHaveBeenCalled();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    const mockOnCancel = vi.fn();
    render(<FieldReportForm onCancel={mockOnCancel} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OperationsMap from '../../components/dashboard/OperationsMap';

// Mock NERMap since Leaflet doesn't work well in JSDOM without canvas mock
vi.mock('../../components/map', () => ({
  NERMap: ({ showDistricts, showRoads }) => (
    <div data-testid="ner-map-mock">
      Districts: {showDistricts ? 'Yes' : 'No'}
      Roads: {showRoads ? 'Yes' : 'No'}
    </div>
  ),
}));

describe('OperationsMap', () => {
  it('renders all map controls and toggles', () => {
    render(<OperationsMap />);
    
    expect(screen.getByText('NER GIS Operational Geospatial Surface')).toBeInTheDocument();
    
    // Check if layer toggles exist
    expect(screen.getByText('Districts')).toBeInTheDocument();
    expect(screen.getByText('Roads')).toBeInTheDocument();
    expect(screen.getByText('Incidents')).toBeInTheDocument();
    expect(screen.getByText('Fleet')).toBeInTheDocument();
    expect(screen.getByText('Hazard Zones')).toBeInTheDocument();
    expect(screen.getByText('Routes')).toBeInTheDocument();
  });

  it('toggles map layers', () => {
    render(<OperationsMap />);
    
    // Initially true
    expect(screen.getByTestId('ner-map-mock')).toHaveTextContent('Districts: Yes');
    
    // Click to toggle off
    fireEvent.click(screen.getByText('Districts'));
    expect(screen.getByTestId('ner-map-mock')).toHaveTextContent('Districts: No');
  });

  it('displays inspector when item is selected', () => {
    const inspectedItem = {
      type: 'Road Corridor',
      data: { name: 'NH-27', status: 'OPEN' },
    };
    
    render(<OperationsMap inspectedItem={inspectedItem} />);
    
    expect(screen.getByText('Inspector: Road Corridor')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('NH-27')).toBeInTheDocument();
  });

  it('calls onClearInspection when closing inspector', () => {
    const mockOnClear = vi.fn();
    const inspectedItem = { type: 'Test', data: { id: 1 } };
    
    render(<OperationsMap inspectedItem={inspectedItem} onClearInspection={mockOnClear} />);
    
    const closeBtn = screen.getByLabelText('Close Inspector');
    fireEvent.click(closeBtn);
    
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('calls onSelectRouteId when route pill is clicked', () => {
    const mockOnSelect = vi.fn();
    render(<OperationsMap onSelectRouteId={mockOnSelect} />);
    
    fireEvent.click(screen.getByText('🔴 Primary (Blocked)'));
    expect(mockOnSelect).toHaveBeenCalledWith('ROUTE-PRIMARY');
  });
});

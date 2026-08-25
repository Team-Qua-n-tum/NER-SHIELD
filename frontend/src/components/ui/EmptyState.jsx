import React from 'react';
import { AlertCircle } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = AlertCircle,
  title = 'No Data Available',
  description = 'No operational records match the current filter or criteria.',
  action,
  className = '',
}) => {
  return (
    <div className={`ui-empty-state ${className}`}>
      <div className="ui-empty-state-icon-box">
        <Icon className="ui-empty-state-icon" />
      </div>
      <h4 className="ui-empty-state-title">{title}</h4>
      <p className="ui-empty-state-desc">{description}</p>
      {action && <div className="ui-empty-state-action">{action}</div>}
    </div>
  );
};

export default EmptyState;

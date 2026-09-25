import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

export const Toast = ({
  message,
  type = 'success', // success | error | warning | info
  onClose,
  title,
  className = '',
}) => {
  if (!message) return null;

  const icons = {
    success: CheckCircle2,
    error: AlertOctagon,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[type] || Info;

  return (
    <div className={`ui-toast ui-toast-${type} ${className}`}>
      <Icon className="ui-toast-icon" />
      <div className="ui-toast-content">
        {title && <h5 className="ui-toast-title">{title}</h5>}
        <p className="ui-toast-message">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="ui-toast-close" aria-label="Close notification">
          <X className="ui-toast-close-icon" />
        </button>
      )}
    </div>
  );
};

export default Toast;

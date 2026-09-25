import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  icon: Icon,
  action,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  variant = 'default', // default | elevated | alert | success | warning
  ...props
}) => {
  return (
    <div className={`ui-card ui-card-${variant} ${className}`} {...props}>
      {(title || Icon || action) && (
        <div className={`ui-card-header ${headerClassName}`}>
          <div className="ui-card-title-group">
            {Icon && <Icon className="ui-card-icon" />}
            <div>
              {title && <h3 className="ui-card-title">{title}</h3>}
              {subtitle && <p className="ui-card-subtitle">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="ui-card-action">{action}</div>}
        </div>
      )}
      <div className={`ui-card-body ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default Card;

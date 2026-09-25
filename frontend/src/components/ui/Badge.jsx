import React from 'react';

export const Badge = ({
  children,
  variant = 'default', // default | critical | high | moderate | low | success | info | primary
  size = 'md', // sm | md | lg
  icon: Icon,
  className = '',
  ...props
}) => {
  const variantClass = `ui-badge-${variant.toLowerCase()}`;
  const sizeClass = `ui-badge-${size}`;

  return (
    <span className={`ui-badge ${variantClass} ${sizeClass} ${className}`} {...props}>
      {Icon && <Icon className="ui-badge-icon" />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;

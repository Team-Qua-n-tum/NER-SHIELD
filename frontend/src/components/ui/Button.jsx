import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // primary | secondary | danger | outline | ghost | success
  size = 'md', // sm | md | lg
  icon: Icon,
  iconRight: IconRight,
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`ui-btn ui-btn-${variant} ui-btn-${size} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="ui-btn-spinner" />
      ) : Icon ? (
        <Icon className="ui-btn-icon" />
      ) : null}
      <span>{children}</span>
      {IconRight && !isLoading && <IconRight className="ui-btn-icon-right" />}
    </button>
  );
};

export default Button;

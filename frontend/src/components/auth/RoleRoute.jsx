/**
 * RoleRoute
 *
 * Extends ProtectedRoute with an additional role check.
 * If the authenticated user's role is not in `allowedRoles`,
 * renders PermissionDenied instead of children.
 *
 * Usage:
 *   <RoleRoute allowedRoles={['admin']}>
 *     <AdminDashboard />
 *   </RoleRoute>
 *
 * ⚠️  SECURITY NOTE: This is UI-layer only. Backend must enforce
 *     authorization independently on every API endpoint.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PermissionDenied } from './PermissionDenied';
import { useAuth } from '../../context/AuthContext';

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, isLoading } = useAuth();

  // Let ProtectedRoute handle the loading + unauthenticated case
  return (
    <ProtectedRoute>
      <RoleCheck allowedRoles={allowedRoles} user={user} isLoading={isLoading}>
        {children || <Outlet />}
      </RoleCheck>
    </ProtectedRoute>
  );
};

function RoleCheck({ allowedRoles, user, isLoading, children }) {
  // Still loading — ProtectedRoute already renders its spinner, so return null here
  if (isLoading || !user) return null;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <PermissionDenied requiredRoles={allowedRoles} userRole={user.role} />;
  }

  return children || <Outlet />;
}

export default RoleRoute;

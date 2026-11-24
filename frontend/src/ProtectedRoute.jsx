// src/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { getUser } from "./utilis/auth";
import { EXPIRED_LOGIN_URL, clearSession, isSessionExpired } from "./utilis/session";

const ProtectedRoute = ({ allowedRoles }) => {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // localStorage outlives the cookie: once it has expired, don't trust the stored user
  if (isSessionExpired(user)) {
    clearSession();
    return <Navigate to={EXPIRED_LOGIN_URL} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
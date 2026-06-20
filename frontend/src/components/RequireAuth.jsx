import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './UI';

function AccessDenied() {
  return (
    <div className="page-container max-w-lg text-center py-16">
      <div className="card p-12">
        <div className="text-5xl mb-4">&#128274;</div>
        <h1 className="text-2xl font-bold text-[#111827] mb-2">Access Denied</h1>
        <p className="text-[#6B7280]">You do not have permission to access this page.</p>
      </div>
    </div>
  );
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-container"><LoadingSpinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function CustomerOnly({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="page-container"><LoadingSpinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="page-container"><LoadingSpinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <AccessDenied />;
  return children;
}

export function RequireSeller({ children }) {
  const { user, isSeller, loading } = useAuth();
  if (loading) return <div className="page-container"><LoadingSpinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isSeller) return <AccessDenied />;
  return children;
}

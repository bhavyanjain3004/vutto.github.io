import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
export function ProtectedRoute({ children, requiredRole }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[#d23657] border-t-transparent" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div
        data-testid="forbidden-page"
        className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center"
      >
        <div className="flex size-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <ShieldAlert className="size-8" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold text-gray-900">
          403 — Access Denied
        </h1>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          You do not have administrative privileges to access this page.
        </p>
        <Link
          to="/"
          data-testid="forbidden-home-link"
          className="mt-6 rounded-xl bg-[#d23657] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#b02644]"
        >
          Return to home
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}

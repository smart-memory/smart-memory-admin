import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from './Layout';
import Login from './Login';
import Dashboard from './Dashboard';
import Users from './Users';
import Tenants from './Tenants';
import Billing from './Billing';
import System from './System';
import Activity from './Activity';
import FeatureFlags from './FeatureFlags';
import Deployments from './Deployments';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, isSuperadmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperadmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Superadmin privileges required</p>
        </div>
      </div>
    );
  }

  return children;
}

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function Pages() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/users" element={<ProtectedLayout><Users /></ProtectedLayout>} />
        <Route path="/tenants" element={<ProtectedLayout><Tenants /></ProtectedLayout>} />
        <Route path="/billing" element={<ProtectedLayout><Billing /></ProtectedLayout>} />
        <Route path="/deployments" element={<ProtectedLayout><Deployments /></ProtectedLayout>} />
        <Route path="/system" element={<ProtectedLayout><System /></ProtectedLayout>} />
        <Route path="/activity" element={<ProtectedLayout><Activity /></ProtectedLayout>} />
        <Route path="/featureflags" element={<ProtectedLayout><FeatureFlags /></ProtectedLayout>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

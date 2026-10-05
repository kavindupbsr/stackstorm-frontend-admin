import React, { useState, useEffect } from 'react';
import AdminLayout from './components/layout/AdminLayout';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import AdminRoute from './routes/AdminRoute';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import OrdersFulfillmentPage from './pages/OrdersFulfillmentPage';
import ReturnsReviewPage from './pages/ReturnsReviewPage';
import LoyaltyConsolePage from './pages/LoyaltyConsolePage';
import './styles/admin-tokens.css';
import './styles/admin-global.css';

function AdminAppContent() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    healthy: false,
    message: 'Testing API Gateway...',
  });
  const { user } = useAdminAuth();

  // Poll backend health via Vite proxy on port 5000
  useEffect(() => {
    let isMounted = true;
    fetch('/api/v1/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setBackendStatus({
            checked: true,
            healthy: data.success === true,
            message: 'Backend Online (Port 5000)',
          });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setBackendStatus({
            checked: true,
            healthy: false,
            message: `Gateway Standby: ${err.message}`,
          });
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminRoute>
      <AdminLayout
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isBackendHealthy={backendStatus.healthy}
        gatewayMessage={backendStatus.message}
        operatorName={user?.name || 'Amarawickrama R.H.'}
        operatorRole={user?.role === 'admin' ? 'Executive Store Owner' : 'Inventory Operations Manager'}
      >
        {/* View 1: Dashboard & KPIs */}
        {currentTab === 'dashboard' && (
          <DashboardPage
            isBackendHealthy={backendStatus.healthy}
            gatewayMessage={backendStatus.message}
          />
        )}

        {/* View 2: Inventory & SKUs */}
        {currentTab === 'inventory' && <InventoryPage />}

        {/* View 3: Order Fulfillment */}
        {currentTab === 'orders' && <OrdersFulfillmentPage />}

        {/* View 4: 30-Day Returns */}
        {currentTab === 'returns' && <ReturnsReviewPage />}

        {/* View 5: Loyalty Tiers & 2-Quarter Grace Period */}
        {currentTab === 'loyalty' && <LoyaltyConsolePage />}

        {/* View 6: Live Support Chat */}
        {currentTab === 'support' && (
          <div className="admin-view">
            <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
              Real-Time Support Agent Console
            </h1>
            <p style={{ marginBottom: 'var(--space-6)' }}>
              Accept active customer chat sessions, answer inquiries, and view real-time typing indicators.
            </p>
            <div className="admin-card">
              <p style={{ color: 'var(--admin-text-muted)' }}>
                Socket.IO bi-directional agent support queue (STORM-FE-022).
              </p>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminRoute>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <AdminAppContent />
    </AdminAuthProvider>
  );
}

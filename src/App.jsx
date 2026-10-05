import React, { useState, useEffect } from 'react'
import AdminLayout from './components/layout/AdminLayout'
import {
  DollarSign,
  Package,
  ShoppingBag,
  Headphones,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Award,
  Layers,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import './styles/admin-tokens.css'
import './styles/admin-global.css'

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    healthy: false,
    message: 'Testing API Gateway...',
  })

  // Poll backend health via Vite proxy on port 5000
  useEffect(() => {
    let isMounted = true
    fetch('/api/v1/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (isMounted) {
          setBackendStatus({
            checked: true,
            healthy: data.success === true,
            message: 'Backend Online (Port 5000)',
          })
        }
      })
      .catch((err) => {
        if (isMounted) {
          setBackendStatus({
            checked: true,
            healthy: false,
            message: `Gateway Standby: ${err.message}`,
          })
        }
      })
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      isBackendHealthy={backendStatus.healthy}
      gatewayMessage={backendStatus.message}
    >
      {/* View 1: Dashboard & KPIs */}
      {currentTab === 'dashboard' && (
        <div className="admin-view">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)' }}>Executive Operations Dashboard</h1>
              <p>Real-time retail sales telemetry for Dickwella Fashion Corner.</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="badge badge-info"
              style={{ padding: '6px 12px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}
            >
              <RefreshCw size={12} style={{ marginRight: 4 }} /> Refresh Data
            </button>
          </div>

          {/* 4 KPI Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Monthly Revenue
                </span>
                <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'var(--admin-primary-subtle)', color: 'var(--admin-primary)' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--admin-text)' }}>
                LKR 845,200.00
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: 'var(--text-xs)', color: 'var(--admin-success)' }}>
                <TrendingUp size={14} />
                <span>+18.4% from last month</span>
              </div>
            </div>

            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active Orders Fulfilled
                </span>
                <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--admin-success)' }}>
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--admin-text)' }}>
                142 Orders
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: 'var(--text-xs)', color: 'var(--admin-text-muted)' }}>
                <span>8 awaiting dispatch</span>
              </div>
            </div>

            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Low-Stock SKU Alerts
                </span>
                <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'var(--admin-danger-bg)', color: 'var(--admin-danger)' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--admin-danger)' }}>
                3 Variants
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: 'var(--text-xs)', color: 'var(--admin-danger)' }}>
                <span>Available stock &lt; 5 units</span>
              </div>
            </div>

            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Support Queue
                </span>
                <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'var(--admin-accent-subtle)', color: 'var(--admin-accent)' }}>
                  <Headphones size={18} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--admin-accent)' }}>
                2 Active Chats
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: 'var(--text-xs)', color: 'var(--admin-text-muted)' }}>
                <span>Avg response: 45s</span>
              </div>
            </div>
          </div>

          {/* Design System & Port Telemetry */}
          <div className="admin-card" style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
              <Layers size={18} color="var(--admin-primary)" />
              <h2 style={{ fontSize: 'var(--text-base)', color: 'var(--admin-text)' }}>
                Control Room Architecture & Design Tokens
              </h2>
              <span className="badge badge-success">STORM-FE-003 Verified</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-3)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <div style={{ padding: '10px', background: 'var(--admin-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--admin-border)' }}>
                <div style={{ color: 'var(--admin-text-muted)' }}>Background Surface</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--admin-text)', marginTop: '2px' }}>
                  #0B0F19 (Deep Obsidian)
                </div>
              </div>
              <div style={{ padding: '10px', background: 'var(--admin-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--admin-border)' }}>
                <div style={{ color: 'var(--admin-text-muted)' }}>Primary Highlight</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--admin-primary)', marginTop: '2px' }}>
                  #38BDF8 (Sky Blue)
                </div>
              </div>
              <div style={{ padding: '10px', background: 'var(--admin-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--admin-border)' }}>
                <div style={{ color: 'var(--admin-text-muted)' }}>Vite Admin Port</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--admin-accent)', marginTop: '2px' }}>
                  Port 5174 (Strict)
                </div>
              </div>
              <div style={{ padding: '10px', background: 'var(--admin-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--admin-border)' }}>
                <div style={{ color: 'var(--admin-text-muted)' }}>Backend Reverse Proxy</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: backendStatus.healthy ? 'var(--admin-success)' : 'var(--admin-warning)', marginTop: '2px' }}>
                  {backendStatus.message}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Inventory & SKUs */}
      {currentTab === 'inventory' && (
        <div className="admin-view">
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>Inventory & SKU Restock Matrix</h1>
          <p style={{ marginBottom: 'var(--space-6)' }}>Monitor on-hand inventory, 15-minute temporary reservations, and execute stock adjustments.</p>
          <div className="admin-card">
            <p style={{ color: 'var(--admin-text-muted)' }}>Inventory restock management matrix connected to POST /api/v1/inventory/adjust (STORM-FE-018).</p>
          </div>
        </div>
      )}

      {/* View 3: Order Fulfillment */}
      {currentTab === 'orders' && (
        <div className="admin-view">
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>Order Fulfillment Console</h1>
          <p style={{ marginBottom: 'var(--space-6)' }}>Advance orders through Placed, Processing, Shipped, and Delivered milestones.</p>
          <div className="admin-card">
            <p style={{ color: 'var(--admin-text-muted)' }}>Order status transitions and delivery timestamp logging (STORM-FE-019).</p>
          </div>
        </div>
      )}

      {/* View 4: 30-Day Returns */}
      {currentTab === 'returns' && (
        <div className="admin-view">
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>30-Day Delivery Return & Exchange Approvals</h1>
          <p style={{ marginBottom: 'var(--space-6)' }}>Inspect customer photographic proof and approve returns strictly within 30 days of delivery date.</p>
          <div className="admin-card">
            <p style={{ color: 'var(--admin-text-muted)' }}>Returns policy audit and refund/exchange dispatch engine (STORM-FE-019).</p>
          </div>
        </div>
      )}

      {/* View 5: Loyalty Tiers */}
      {currentTab === 'loyalty' && (
        <div className="admin-view">
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>Customer Loyalty Tier Oversight</h1>
          <p style={{ marginBottom: 'var(--space-6)' }}>Review Silver, Gold, and Platinum tier distributions and manage the 2-quarter grace period.</p>
          <div className="admin-card">
            <p style={{ color: 'var(--admin-text-muted)' }}>Loyalty tier grace period downgrade manager (STORM-FE-020).</p>
          </div>
        </div>
      )}

      {/* View 6: Live Support Chat */}
      {currentTab === 'support' && (
        <div className="admin-view">
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>Real-Time Support Agent Console</h1>
          <p style={{ marginBottom: 'var(--space-6)' }}>Accept active customer chat sessions, answer inquiries, and view real-time typing indicators.</p>
          <div className="admin-card">
            <p style={{ color: 'var(--admin-text-muted)' }}>Socket.IO bi-directional agent support queue (STORM-FE-022).</p>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

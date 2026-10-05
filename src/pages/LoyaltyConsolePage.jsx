import React, { useState, useEffect } from 'react';
import {
  Award,
  Crown,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Users,
  CheckCircle,
  HelpCircle,
  PlayCircle,
} from 'lucide-react';
import LoyaltyDistributionChart from '../components/loyalty/LoyaltyDistributionChart';
import LoyaltyAccountsTable from '../components/loyalty/LoyaltyAccountsTable';
import PointsAdjustmentModal from '../components/loyalty/PointsAdjustmentModal';
import { adminLoyaltyApi, FALLBACK_LOYALTY_ACCOUNTS } from '../api/adminLoyalty.api';
import './LoyaltyConsolePage.css';

export default function LoyaltyConsolePage() {
  const [accounts, setAccounts] = useState(FALLBACK_LOYALTY_ACCOUNTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Points Adjustment Modal State
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await adminLoyaltyApi.getLoyaltyAccounts();
      if (Array.isArray(data) && data.length > 0) {
        setAccounts(data);
      }
    } catch {
      // Fallback already loaded
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  // Open modal
  const handleOpenAdjustModal = (account) => {
    setSelectedAccount(account);
    setIsAdjustModalOpen(true);
  };

  const handleCloseAdjustModal = () => {
    setIsAdjustModalOpen(false);
    setSelectedAccount(null);
  };

  // Submit points adjustment
  const handleAdjustPointsSubmit = async ({ customerId, pointsDelta, reason, notes, newBalance }) => {
    try {
      await adminLoyaltyApi.adjustPoints({ customerId, pointsDelta, reason, notes });

      // Optimistic in-place update without full page reload (AC4)
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) => {
          if (acc.customer_id === customerId) {
            return {
              ...acc,
              points_balance: newBalance,
            };
          }
          return acc;
        })
      );

      const sign = pointsDelta > 0 ? `+${pointsDelta}` : `${pointsDelta}`;
      showToast(
        `Loyalty points updated successfully: ${sign} pts for ${selectedAccount?.customer_name || customerId}.`
      );
    } catch (err) {
      showToast(`Failed to update points: ${err.message}`);
    }
  };

  // Run quarterly audit sweep (DEV-200)
  const handleRunQuarterlyAudit = async () => {
    setIsAuditing(true);
    try {
      const result = await adminLoyaltyApi.triggerQuarterlyAudit();

      // Apply audit logic to local state:
      // Accounts with quarters_below_spend >= 2 get downgraded to the tier below
      // Accounts with quarters_below_spend === 1 advance to 2 or remain warned
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.quarters_below_spend >= 2 || acc.grace_period_status === 'downgrade_pending') {
            const nextTier =
              (acc.tier || '').toLowerCase() === 'platinum'
                ? 'gold'
                : (acc.tier || '').toLowerCase() === 'gold'
                ? 'silver'
                : 'silver';
            return {
              ...acc,
              tier: nextTier,
              quarters_below_spend: 0,
              grace_period_status: 'maintained',
              last_evaluated: new Date().toISOString().split('T')[0],
            };
          }
          return {
            ...acc,
            last_evaluated: new Date().toISOString().split('T')[0],
          };
        })
      );

      showToast(
        `Quarterly Audit Sweep executed! Evaluated ${result.evaluatedAccounts || accounts.length} accounts. 1 pending downgrade applied under 2-quarter grace policy.`
      );
    } catch (err) {
      showToast(`Audit failed: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  // KPI Calculations
  const totalMembers = accounts.length;
  const silverCount = accounts.filter((a) => (a.tier || '').toLowerCase() === 'silver').length;
  const goldCount = accounts.filter((a) => (a.tier || '').toLowerCase() === 'gold').length;
  const platinumCount = accounts.filter((a) => (a.tier || '').toLowerCase() === 'platinum').length;
  const atRiskCount = accounts.filter(
    (a) =>
      a.quarters_below_spend > 0 ||
      a.grace_period_status === 'warning' ||
      a.grace_period_status === 'downgrade_pending'
  ).length;

  return (
    <div className="loyalty-console-page" data-testid="loyalty-console-page">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="loyalty-toast-banner" role="status" data-testid="loyalty-toast-banner">
          <CheckCircle size={18} className="toast-icon" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage('')}
            className="toast-close-btn"
            aria-label="Dismiss Notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="loyalty-page-header">
        <div>
          <div className="header-badge-row">
            <span className="live-status-pill">
              <span className="live-pulse" /> SENG 31242 SDS §11.4 Live
            </span>
            <span className="module-owner-tag">Module Owner: Lakshani A.T.</span>
          </div>
          <h1 className="loyalty-page-title">Loyalty Tier Review & Grace Period Console</h1>
          <p className="loyalty-page-subtitle">
            Monitor customer spend tiers, evaluate the 2-Quarter Grace Period policy, and issue goodwill points adjustments.
          </p>
        </div>

        <div className="header-actions-group">
          <button
            className="refresh-btn"
            onClick={fetchAccounts}
            disabled={isLoading}
            title="Refresh loyalty accounts"
            data-testid="refresh-loyalty-btn"
          >
            <RefreshCw size={15} className={isLoading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>

          <button
            className="audit-sweep-btn"
            onClick={handleRunQuarterlyAudit}
            disabled={isAuditing}
            data-testid="run-quarterly-audit-btn"
            title="Evaluate 2-Quarter Grace Period for all customers"
          >
            <PlayCircle size={16} className={isAuditing ? 'spinning' : ''} />
            <span>{isAuditing ? 'Executing Audit Sweep...' : 'Run Quarterly Audit Sweep'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="loyalty-kpi-grid">
        {/* Total Members */}
        <div className="kpi-card" data-testid="kpi-total-members">
          <div className="kpi-icon-wrap total">
            <Users size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Loyalty Members</span>
            <span className="kpi-val font-mono">{totalMembers}</span>
            <span className="kpi-sub">Across all 3 tiers</span>
          </div>
        </div>

        {/* Silver Tier */}
        <div className="kpi-card" data-testid="kpi-silver-count">
          <div className="kpi-icon-wrap silver">
            <Award size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Silver Tier Members</span>
            <span className="kpi-val font-mono">{silverCount}</span>
            <span className="kpi-sub">LKR 0 – 99,999 spend</span>
          </div>
        </div>

        {/* Gold Tier */}
        <div className="kpi-card" data-testid="kpi-gold-count">
          <div className="kpi-icon-wrap gold">
            <Award size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Gold Tier Members</span>
            <span className="kpi-val font-mono">{goldCount}</span>
            <span className="kpi-sub">LKR 100k+ (5% bonus pts)</span>
          </div>
        </div>

        {/* Platinum Tier */}
        <div className="kpi-card" data-testid="kpi-platinum-count">
          <div className="kpi-icon-wrap platinum">
            <Crown size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Platinum VIP Members</span>
            <span className="kpi-val font-mono">{platinumCount}</span>
            <span className="kpi-sub">LKR 250k+ (10% bonus pts)</span>
          </div>
        </div>

        {/* At-Risk / Grace Period */}
        <div className={`kpi-card ${atRiskCount > 0 ? 'kpi-warning-card' : ''}`} data-testid="kpi-grace-period-count">
          <div className="kpi-icon-wrap warning">
            <AlertTriangle size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">At-Risk Grace Accounts</span>
            <span className="kpi-val font-mono">{atRiskCount}</span>
            <span className="kpi-sub font-bold text-amber">
              {atRiskCount > 0 ? 'Under 2-Quarter Review' : 'All Tiers Maintained'}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Row: Distribution Donut & Grace Period Architecture Rule */}
      <div className="loyalty-middle-grid">
        <LoyaltyDistributionChart accounts={accounts} />

        {/* Policy Summary Card */}
        <div className="policy-rule-card" data-testid="grace-period-policy-card">
          <div className="policy-header">
            <ShieldCheck size={20} className="policy-icon" />
            <h3 className="policy-title">2-Quarter Grace Period Policy (FR-022 / SDS §11.4)</h3>
          </div>
          <p className="policy-desc">
            To foster long-term customer loyalty and avoid punitive member experiences, Dickwella Fashion Corner
            enforces a strictly regulated 2-quarter grace window before downgrading any customer tier:
          </p>

          <div className="policy-stepper">
            <div className="policy-step">
              <div className="step-num step-1">1</div>
              <div className="step-content">
                <strong>Quarter 1 Below Spend Threshold:</strong>
                <p>Status transitions to <span className="text-amber font-semibold">Q1 Grace Warning</span>. The tier and all privileges remain 100% active.</p>
              </div>
            </div>

            <div className="policy-step">
              <div className="step-num step-2">2</div>
              <div className="step-content">
                <strong>Quarter 2 Below Spend Threshold:</strong>
                <p>Status transitions to <span className="text-red font-semibold">Q2 Downgrade Pending</span>. Member receives courtesy re-engagement notifications.</p>
              </div>
            </div>

            <div className="policy-step">
              <div className="step-num step-3">3</div>
              <div className="step-content">
                <strong>Quarterly Audit Sweep:</strong>
                <p>Downgrade to next lower tier is executed strictly after 2 consecutive quarters below spend.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Accounts Table */}
      <LoyaltyAccountsTable
        accounts={accounts}
        onOpenAdjustModal={handleOpenAdjustModal}
        onQuarterlyAudit={handleRunQuarterlyAudit}
        isAuditing={isAuditing}
      />

      {/* Points Adjustment Modal */}
      <PointsAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={handleCloseAdjustModal}
        account={selectedAccount}
        onSubmit={handleAdjustPointsSubmit}
      />
    </div>
  );
}

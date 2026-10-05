import React, { useState } from 'react';
import {
  Search,
  Filter,
  Award,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Clock,
  ArrowUpDown,
  Coins,
  SlidersHorizontal,
} from 'lucide-react';
import './LoyaltyAccountsTable.css';

export default function LoyaltyAccountsTable({
  accounts = [],
  onOpenAdjustModal,
  onQuarterlyAudit,
  isAuditing = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all'); // 'all' | 'silver' | 'gold' | 'platinum' | 'grace_warning'
  const [sortBy, setSortBy] = useState('spend_desc'); // 'spend_desc' | 'spend_asc' | 'points_desc' | 'name_asc'

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      (acc.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.customer_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedTier === 'all') return true;
    if (selectedTier === 'grace_warning') {
      return (
        acc.quarters_below_spend > 0 ||
        acc.grace_period_status === 'warning' ||
        acc.grace_period_status === 'downgrade_pending'
      );
    }
    return (acc.tier || '').toLowerCase() === selectedTier.toLowerCase();
  });

  // Sort accounts
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (sortBy === 'spend_desc') return (b.annual_spend || 0) - (a.annual_spend || 0);
    if (sortBy === 'spend_asc') return (a.annual_spend || 0) - (b.annual_spend || 0);
    if (sortBy === 'points_desc') return (b.points_balance || 0) - (a.points_balance || 0);
    if (sortBy === 'name_asc') return (a.customer_name || '').localeCompare(b.customer_name || '');
    return 0;
  });

  const getGraceStatusBadge = (acc) => {
    const quarters = acc.quarters_below_spend || 0;
    const status = acc.grace_period_status;

    if (quarters >= 2 || status === 'downgrade_pending') {
      return (
        <span
          className="grace-badge red-alert"
          title="2 consecutive quarters below spend threshold. Downgrade pending next quarterly audit sweep."
          data-testid="grace-badge-downgrade-pending"
        >
          <AlertOctagon size={13} />
          <span>Q2 Downgrade Pending</span>
        </span>
      );
    }

    if (quarters === 1 || status === 'warning') {
      return (
        <span
          className="grace-badge amber-warning"
          title="1 quarter below spend threshold. Tier preserved under 2-Quarter Grace Period Policy."
          data-testid="grace-badge-q1-warning"
        >
          <AlertTriangle size={13} />
          <span>Q1 Grace Warning</span>
        </span>
      );
    }

    return (
      <span
        className="grace-badge green-maintained"
        title="Account meets spend requirement. Tier actively maintained."
        data-testid="grace-badge-maintained"
      >
        <ShieldCheck size={13} />
        <span>Active / Maintained</span>
      </span>
    );
  };

  const getTierPill = (tier) => {
    const t = (tier || 'silver').toLowerCase();
    return (
      <span className={`tier-badge tier-${t}`} data-testid={`tier-pill-${t}`}>
        <Award size={12} />
        <span>{t.toUpperCase()}</span>
      </span>
    );
  };

  return (
    <div className="loyalty-table-container" data-testid="loyalty-accounts-table-container">
      {/* Control Bar: Search, Filters & Actions */}
      <div className="loyalty-table-controls">
        <div className="search-box-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="loyalty-search-input"
            placeholder="Search customer by name, email, or customer ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="loyalty-search-input"
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear Search"
            >
              ×
            </button>
          )}
        </div>

        {/* Tier Filter Tabs */}
        <div className="tier-filter-pills" role="tablist">
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'silver', label: 'Silver' },
            { id: 'gold', label: 'Gold' },
            { id: 'platinum', label: 'Platinum' },
            { id: 'grace_warning', label: 'Grace Warnings ⚠️' },
          ].map((pill) => (
            <button
              key={pill.id}
              role="tab"
              aria-selected={selectedTier === pill.id}
              className={`tier-pill-btn ${selectedTier === pill.id ? 'active' : ''}`}
              onClick={() => setSelectedTier(pill.id)}
              data-testid={`filter-tier-${pill.id}`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="sort-selector-wrapper">
          <ArrowUpDown size={14} className="sort-icon" />
          <select
            className="loyalty-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            data-testid="loyalty-sort-select"
          >
            <option value="spend_desc">Highest Spend First</option>
            <option value="spend_asc">Lowest Spend First</option>
            <option value="points_desc">Highest Points First</option>
            <option value="name_asc">Customer Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="loyalty-table-scroll">
        <table className="loyalty-accounts-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Current Tier</th>
              <th>Annual Spend vs Threshold</th>
              <th>Points Balance</th>
              <th>2-Quarter Grace Status</th>
              <th>Last Evaluated</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAccounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-accounts-cell">
                  <div className="no-accounts-state">
                    <Award size={32} className="no-accounts-icon" />
                    <p className="no-accounts-title">No customer loyalty accounts found</p>
                    <span className="no-accounts-desc">
                      Try clearing or adjusting your search query and tier filters.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedAccounts.map((account) => {
                const spend = account.annual_spend || 0;
                const threshold = account.tier_threshold || 1;
                const spendPercent = Math.min(100, Math.round((spend / threshold) * 100));

                return (
                  <tr
                    key={account.id || account.customer_id}
                    className="loyalty-account-row"
                    data-testid={`loyalty-row-${account.customer_id}`}
                  >
                    {/* Customer */}
                    <td className="customer-info-cell">
                      <div className="customer-name-row">
                        <span className="customer-name-text">{account.customer_name}</span>
                        <span className="customer-id-tag">ID: {account.customer_id}</span>
                      </div>
                      <span className="customer-email-text">{account.customer_email}</span>
                    </td>

                    {/* Current Tier */}
                    <td>{getTierPill(account.tier)}</td>

                    {/* Annual Spend vs Threshold */}
                    <td className="spend-cell">
                      <div className="spend-text-row">
                        <span className="font-mono font-bold spend-amount">
                          {account.annual_spend_formatted || `LKR ${spend.toLocaleString()}`}
                        </span>
                        <span className="spend-threshold-sub font-mono">
                          / LKR {threshold.toLocaleString()} ({spendPercent}%)
                        </span>
                      </div>
                      <div className="spend-progress-bar-bg">
                        <div
                          className={`spend-progress-bar-fill ${
                            spendPercent >= 100
                              ? 'fill-complete'
                              : spendPercent >= 75
                              ? 'fill-warning'
                              : 'fill-danger'
                          }`}
                          style={{ width: `${spendPercent}%` }}
                        />
                      </div>
                    </td>

                    {/* Points Balance */}
                    <td className="points-cell">
                      <div className="points-value-row">
                        <Coins size={14} className="points-icon" />
                        <span className="font-mono font-bold points-count" data-testid={`points-val-${account.customer_id}`}>
                          {(account.points_balance || 0).toLocaleString()} pts
                        </span>
                      </div>
                    </td>

                    {/* Grace Period Status */}
                    <td>{getGraceStatusBadge(account)}</td>

                    {/* Last Evaluated */}
                    <td className="evaluated-date-cell">
                      <div className="evaluated-date-row">
                        <Clock size={12} />
                        <span>{account.last_evaluated || 'Quarterly Cycle'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="actions-cell text-right">
                      <button
                        className="adjust-points-action-btn"
                        onClick={() => onOpenAdjustModal(account)}
                        data-testid={`adjust-points-btn-${account.customer_id}`}
                        title="Credit or Debit Goodwill Points"
                      >
                        <SlidersHorizontal size={13} />
                        <span>Adjust Points</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="loyalty-table-footer">
        <span className="footer-count-text">
          Showing <strong>{sortedAccounts.length}</strong> of <strong>{accounts.length}</strong> loyalty accounts
        </span>
        <div className="footer-legend">
          <span className="legend-item">
            <span className="legend-dot dot-green" /> Maintained
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-amber" /> Q1 Warning (Tier Preserved)
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-red" /> Q2 Downgrade Pending
          </span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Award, ShieldCheck, Crown } from 'lucide-react';
import './LoyaltyDistributionChart.css';

export default function LoyaltyDistributionChart({ accounts = [] }) {
  const total = accounts.length || 1;

  const silverCount = accounts.filter((a) => (a.tier || '').toLowerCase() === 'silver').length;
  const goldCount = accounts.filter((a) => (a.tier || '').toLowerCase() === 'gold').length;
  const platinumCount = accounts.filter((a) => (a.tier || '').toLowerCase() === 'platinum').length;

  const silverPct = Math.round((silverCount / total) * 100);
  const goldPct = Math.round((goldCount / total) * 100);
  const platinumPct = 100 - silverPct - goldPct; // Ensure sum equals 100%

  // SVG Donut calculation
  const radius = 60;
  const circumference = 2 * Math.PI * radius; // ~376.99

  const silverStroke = (silverCount / total) * circumference;
  const goldStroke = (goldCount / total) * circumference;
  const platinumStroke = (platinumCount / total) * circumference;

  // Offsets
  const silverOffset = 0;
  const goldOffset = -silverStroke;
  const platinumOffset = -(silverStroke + goldStroke);

  return (
    <div className="loyalty-chart-card" data-testid="loyalty-distribution-chart">
      <div className="chart-header">
        <div className="chart-title-box">
          <div className="title-icon">
            <Award size={18} />
          </div>
          <div>
            <h3 className="chart-title">Customer Loyalty Tier Distribution</h3>
            <p className="chart-sub">Tier proportions across active Dickwella clientele</p>
          </div>
        </div>
      </div>

      <div className="donut-content-layout">
        {/* SVG Donut Visual */}
        <div className="donut-svg-wrapper">
          <svg
            viewBox="0 0 160 160"
            className="donut-svg"
            role="img"
            aria-label={`Donut chart showing ${silverPct}% Silver, ${goldPct}% Gold, ${platinumPct}% Platinum`}
          >
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="var(--admin-border, #1E293B)"
              strokeWidth="20"
            />

            {/* Silver Arc */}
            {silverCount > 0 && (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#94A3B8"
                strokeWidth="20"
                strokeDasharray={`${silverStroke} ${circumference}`}
                strokeDashoffset={silverOffset}
                transform="rotate(-90 80 80)"
                data-testid="donut-silver-arc"
              />
            )}

            {/* Gold Arc */}
            {goldCount > 0 && (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#D4AF37"
                strokeWidth="20"
                strokeDasharray={`${goldStroke} ${circumference}`}
                strokeDashoffset={goldOffset}
                transform="rotate(-90 80 80)"
                data-testid="donut-gold-arc"
              />
            )}

            {/* Platinum Arc */}
            {platinumCount > 0 && (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#38BDF8"
                strokeWidth="20"
                strokeDasharray={`${platinumStroke} ${circumference}`}
                strokeDashoffset={platinumOffset}
                transform="rotate(-90 80 80)"
                data-testid="donut-platinum-arc"
              />
            )}
          </svg>

          {/* Center Cutout Text */}
          <div className="donut-center-badge">
            <span className="center-count" data-testid="total-loyalty-members">{total}</span>
            <span className="center-label">Members</span>
          </div>
        </div>

        {/* Legend / Metrics List */}
        <div className="donut-legend-list">
          <div className="legend-row">
            <div className="legend-indicator dot-silver"></div>
            <div className="legend-info">
              <span className="legend-tier-name">Silver Tier</span>
              <span className="legend-threshold">Entry Level • Standard Benefits</span>
            </div>
            <div className="legend-stats">
              <span className="legend-count">{silverCount} accounts</span>
              <span className="legend-pct" data-testid="pct-silver">{silverPct}%</span>
            </div>
          </div>

          <div className="legend-row">
            <div className="legend-indicator dot-gold"></div>
            <div className="legend-info">
              <span className="legend-tier-name">Gold Tier</span>
              <span className="legend-threshold">Spend &gt; LKR 100K • 1.5x Multiplier</span>
            </div>
            <div className="legend-stats">
              <span className="legend-count">{goldCount} accounts</span>
              <span className="legend-pct" data-testid="pct-gold">{goldPct}%</span>
            </div>
          </div>

          <div className="legend-row">
            <div className="legend-indicator dot-platinum"></div>
            <div className="legend-info">
              <span className="legend-tier-name">Platinum VIP Tier</span>
              <span className="legend-threshold">Spend &gt; LKR 250K • 2.0x Multiplier</span>
            </div>
            <div className="legend-stats">
              <span className="legend-count">{platinumCount} accounts</span>
              <span className="legend-pct" data-testid="pct-platinum">{platinumPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoyaltyDistributionChart from '../components/loyalty/LoyaltyDistributionChart';
import PointsAdjustmentModal from '../components/loyalty/PointsAdjustmentModal';
import LoyaltyAccountsTable from '../components/loyalty/LoyaltyAccountsTable';
import LoyaltyConsolePage from '../pages/LoyaltyConsolePage';
import {
  FALLBACK_LOYALTY_ACCOUNTS,
  adminLoyaltyApi,
} from '../api/adminLoyalty.api';

describe('STORM-FE-020: Loyalty Tier Review Console & 2-Quarter Grace Period Downgrade Management', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/v1/loyalty/accounts')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              data: { accounts: FALLBACK_LOYALTY_ACCOUNTS },
            }),
        });
      }
      if (url.includes('/api/v1/loyalty/adjust') && opts?.method === 'POST') {
        const body = JSON.parse(opts.body || '{}');
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                customerId: body.customerId,
                pointsDelta: body.pointsDelta,
                reason: body.reason,
                notes: body.notes,
                updatedAt: new Date().toISOString(),
              },
            }),
        });
      }
      if (url.includes('/api/v1/loyalty/audit') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                evaluatedAccounts: FALLBACK_LOYALTY_ACCOUNTS.length,
                downgradedCount: 1,
                warnedCount: 1,
              },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* DEV-198: Loyalty Tier Review Console & Distribution SVG Chart              */
  /* -------------------------------------------------------------------------- */
  describe('DEV-198: Loyalty Tier Review Console & Distribution SVG Chart', () => {
    it('renders the SVG Donut chart with Silver, Gold, Platinum segments and percentages', () => {
      render(<LoyaltyDistributionChart accounts={FALLBACK_LOYALTY_ACCOUNTS} />);

      expect(screen.getByTestId('loyalty-distribution-chart')).toBeInTheDocument();
      expect(screen.getByText(/Customer Loyalty Tier Distribution/i)).toBeInTheDocument();
      expect(screen.getByText('Silver Tier')).toBeInTheDocument();
      expect(screen.getByText('Gold Tier')).toBeInTheDocument();
      expect(screen.getByText('Platinum VIP Tier')).toBeInTheDocument();
      expect(screen.getByTestId('pct-silver')).toBeInTheDocument();
      expect(screen.getByTestId('pct-gold')).toBeInTheDocument();
      expect(screen.getByTestId('pct-platinum')).toBeInTheDocument();
      expect(screen.getByTestId('total-loyalty-members')).toBeInTheDocument();
    });

    it('renders LoyaltyConsolePage with KPI cards for total members, tiers, and grace period', async () => {
      render(<LoyaltyConsolePage />);

      await waitFor(() => {
        expect(screen.getByTestId('kpi-total-members')).toBeInTheDocument();
        expect(screen.getByTestId('kpi-silver-count')).toBeInTheDocument();
        expect(screen.getByTestId('kpi-gold-count')).toBeInTheDocument();
        expect(screen.getByTestId('kpi-platinum-count')).toBeInTheDocument();
        expect(screen.getByTestId('kpi-grace-period-count')).toBeInTheDocument();
      });

      expect(screen.getByText(/Loyalty Tier Review & Grace Period Console/i)).toBeInTheDocument();
      expect(screen.getByText(/Module Owner: Lakshani A.T./i)).toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* DEV-199: 2-Quarter Grace Period Downgrade Management & Filtering           */
  /* -------------------------------------------------------------------------- */
  describe('DEV-199: 2-Quarter Grace Period Downgrade Management & Table Filtering', () => {
    it('renders accounts table with customer spend, points, and accurate grace badges', () => {
      const mockOpenAdjust = vi.fn();
      render(
        <LoyaltyAccountsTable
          accounts={FALLBACK_LOYALTY_ACCOUNTS}
          onOpenAdjustModal={mockOpenAdjust}
        />
      );

      // Verify accounts render
      expect(screen.getByText('Kavindu Senanayake')).toBeInTheDocument();
      expect(screen.getByText('Nimasha Fernando')).toBeInTheDocument();
      expect(screen.getByText('Thisara Perera')).toBeInTheDocument();

      // Kavindu meets spend threshold -> Active / Maintained badge
      expect(screen.getAllByTestId('grace-badge-maintained').length).toBeGreaterThan(0);

      // Nimasha has 1 quarter below spend -> Q1 Grace Warning badge (amber)
      expect(screen.getByTestId('grace-badge-q1-warning')).toBeInTheDocument();
      expect(screen.getByText('Q1 Grace Warning')).toBeInTheDocument();

      // Thisara has 2 quarters below spend -> Q2 Downgrade Pending badge (red)
      expect(screen.getByTestId('grace-badge-downgrade-pending')).toBeInTheDocument();
      expect(screen.getAllByText('Q2 Downgrade Pending').length).toBeGreaterThan(0);
    });

    it('filters customer accounts by search query and tier pill buttons', () => {
      render(
        <LoyaltyAccountsTable
          accounts={FALLBACK_LOYALTY_ACCOUNTS}
          onOpenAdjustModal={vi.fn()}
        />
      );

      // Search by name
      const searchInput = screen.getByTestId('loyalty-search-input');
      fireEvent.change(searchInput, { target: { value: 'Nimasha' } });
      expect(screen.getByText('Nimasha Fernando')).toBeInTheDocument();
      expect(screen.queryByText('Kavindu Senanayake')).not.toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('Kavindu Senanayake')).toBeInTheDocument();

      // Filter by "Grace Warnings ⚠️"
      const warningTab = screen.getByTestId('filter-tier-grace_warning');
      fireEvent.click(warningTab);

      // Nimasha (Q1 Warning) and Thisara (Q2 Downgrade) should be visible
      expect(screen.getByText('Nimasha Fernando')).toBeInTheDocument();
      expect(screen.getByText('Thisara Perera')).toBeInTheDocument();
      // Kavindu (Maintained) should not be visible
      expect(screen.queryByText('Kavindu Senanayake')).not.toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* DEV-200: Goodwill Points Adjustment Modal & Quarterly Audit Sweep          */
  /* -------------------------------------------------------------------------- */
  describe('DEV-200: Goodwill Points Adjustment Modal & Quarterly Audit Sweep', () => {
    it('validates points input and triggers onSubmit with credit details', async () => {
      const mockSubmit = vi.fn().mockResolvedValue({});
      const mockClose = vi.fn();
      const account = FALLBACK_LOYALTY_ACCOUNTS[0]; // Kavindu: 1250 pts

      render(
        <PointsAdjustmentModal
          isOpen={true}
          onClose={mockClose}
          account={account}
          onSubmit={mockSubmit}
        />
      );

      expect(screen.getByTestId('points-adjustment-modal')).toBeInTheDocument();
      expect(screen.getByText('Adjust Loyalty Points Balance')).toBeInTheDocument();

      // Change points amount
      const pointsInput = screen.getByTestId('points-qty-input');
      fireEvent.change(pointsInput, { target: { value: '250' } });

      // Preview resulting balance should update: 1250 + 250 = 1500
      expect(screen.getByTestId('resulting-points-balance')).toHaveTextContent('1500 pts');

      // Select reason
      const reasonSelect = screen.getByTestId('points-reason-select');
      fireEvent.change(reasonSelect, {
        target: { value: 'Customer Service Goodwill / CS Resolution' },
      });

      // Submit
      const submitBtn = screen.getByTestId('submit-points-adjustment-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            customerId: account.customer_id,
            pointsDelta: 250,
            reason: 'Customer Service Goodwill / CS Resolution',
            newBalance: 1500,
          })
        );
        expect(mockClose).toHaveBeenCalled();
      });
    });

    it('prevents debiting more points than the customer available balance', async () => {
      const mockSubmit = vi.fn();
      const account = FALLBACK_LOYALTY_ACCOUNTS[1]; // Nimasha: 620 pts

      render(
        <PointsAdjustmentModal
          isOpen={true}
          onClose={vi.fn()}
          account={account}
          onSubmit={mockSubmit}
        />
      );

      // Switch to debit (-)
      const debitToggle = screen.getByTestId('toggle-deduct-points');
      fireEvent.click(debitToggle);

      // Enter points greater than balance (700 > 620)
      const pointsInput = screen.getByTestId('points-qty-input');
      fireEvent.change(pointsInput, { target: { value: '700' } });

      const submitBtn = screen.getByTestId('submit-points-adjustment-btn');
      fireEvent.click(submitBtn);

      expect(await screen.findByTestId('points-modal-error')).toHaveTextContent(
        /Cannot deduct more points than customer balance/i
      );
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('triggers Quarterly Audit Sweep and applies tier downgrade for accounts with 2 quarters below spend', async () => {
      render(<LoyaltyConsolePage />);

      await waitFor(() => {
        expect(screen.getByText('Thisara Perera')).toBeInTheDocument();
      });

      // Before audit, Thisara is Platinum with Q2 Downgrade Pending
      const auditBtn = screen.getByTestId('run-quarterly-audit-btn');
      fireEvent.click(auditBtn);

      await waitFor(() => {
        expect(screen.getByTestId('loyalty-toast-banner')).toBeInTheDocument();
        expect(screen.getByText(/Quarterly Audit Sweep executed!/i)).toBeInTheDocument();
      });

      // After audit sweep, Thisara's tier should have transitioned to Gold under 2-quarter grace policy
      expect(screen.getByTestId('loyalty-row-cust-103')).toHaveTextContent(/GOLD/i);
    });
  });
});

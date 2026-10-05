import React, { useState, useEffect } from 'react';
import { X, Award, Plus, Minus, AlertCircle, ShieldCheck } from 'lucide-react';
import './PointsAdjustmentModal.css';

const GOODWILL_REASONS = [
  'Customer Service Goodwill / CS Resolution',
  'Order Delivery Delay Compensation',
  'Store Promotional Bonus Award',
  'Defective Garment Return Courtesy',
  'Manual Correction / Account Audit',
  'Other Management Goodwill Credit',
];

export default function PointsAdjustmentModal({
  isOpen,
  onClose,
  account,
  onSubmit,
}) {
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' | 'deduct'
  const [points, setPoints] = useState(100);
  const [reason, setReason] = useState(GOODWILL_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAdjustmentType('add');
      setPoints(100);
      setReason(GOODWILL_REASONS[0]);
      setNotes('');
      setError('');
    }
  }, [isOpen, account]);

  if (!isOpen || !account) return null;

  const currentPoints = Number(account.points_balance || 0);
  const delta = adjustmentType === 'add' ? Number(points) : -Number(points);
  const resultingPoints = Math.max(0, currentPoints + delta);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (points <= 0) {
      setError('Points adjustment must be greater than zero.');
      return;
    }

    if (adjustmentType === 'deduct' && currentPoints - points < 0) {
      setError(`Cannot deduct more points than customer balance (${currentPoints} pts available).`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          customerId: account.customer_id,
          pointsDelta: delta,
          reason,
          notes,
          newBalance: resultingPoints,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to apply points adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="loyalty-modal-backdrop" onClick={onClose} data-testid="points-adjustment-modal">
      <div
        className="loyalty-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="points-modal-title"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="header-title-group">
            <div className="title-icon-badge">
              <Award size={20} />
            </div>
            <div>
              <h2 id="points-modal-title" className="modal-title">
                Adjust Loyalty Points Balance
              </h2>
              <span className="customer-target-name">{account.customer_name}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close Modal"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Account Snapshot Bar */}
        <div className="account-snapshot-bar">
          <div>
            <span className="snap-label">Customer Email:</span>
            <span className="snap-val">{account.customer_email}</span>
          </div>
          <div>
            <span className="snap-label">Current Tier:</span>
            <span className={`snap-tier-pill tier-${(account.tier || '').toLowerCase()}`}>
              {(account.tier || 'silver').toUpperCase()}
            </span>
          </div>
          <div>
            <span className="snap-label">Current Points:</span>
            <span className="snap-val font-mono font-bold">{currentPoints} pts</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="points-form">
          {/* Add / Deduct Toggle */}
          <div className="direction-toggle-group" role="radiogroup">
            <button
              type="button"
              className={`direction-btn ${adjustmentType === 'add' ? 'active add' : ''}`}
              onClick={() => setAdjustmentType('add')}
              data-testid="toggle-add-points"
            >
              <Plus size={16} />
              <span>Credit Points (+)</span>
            </button>
            <button
              type="button"
              className={`direction-btn ${adjustmentType === 'deduct' ? 'active deduct' : ''}`}
              onClick={() => setAdjustmentType('deduct')}
              data-testid="toggle-deduct-points"
            >
              <Minus size={16} />
              <span>Debit Points (-)</span>
            </button>
          </div>

          {/* Points Amount Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="points-input">
              Points Amount to {adjustmentType === 'add' ? 'Credit' : 'Debit'}
            </label>
            <input
              id="points-input"
              type="number"
              min="1"
              value={points}
              onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="points-input font-mono"
              data-testid="points-qty-input"
              required
            />
            <div className="quick-points-chips">
              {[50, 100, 250, 500, 1000].map((pt) => (
                <button
                  key={pt}
                  type="button"
                  className="quick-chip"
                  onClick={() => setPoints(pt)}
                >
                  +{pt} pts
                </button>
              ))}
            </div>
          </div>

          {/* Resulting Balance Preview */}
          <div className="balance-preview-box">
            <span className="preview-label">Resulting Loyalty Balance:</span>
            <span className="preview-val font-mono font-bold" data-testid="resulting-points-balance">
              {resultingPoints} pts
            </span>
          </div>

          {/* Reason Select */}
          <div className="form-group">
            <label className="form-label" htmlFor="points-reason-select">
              Goodwill Adjustment Reason <span className="required-star">*</span>
            </label>
            <select
              id="points-reason-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="points-select"
              data-testid="points-reason-select"
              required
            >
              {GOODWILL_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Internal Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="points-notes">
              Customer Support Reference Notes (Optional)
            </label>
            <textarea
              id="points-notes"
              rows={2}
              placeholder="e.g., Courier delay compensation approved by manager."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="points-textarea"
              data-testid="points-notes-input"
            />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="modal-error-alert" role="alert" data-testid="points-modal-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
              data-testid="submit-points-adjustment-btn"
            >
              <ShieldCheck size={16} />
              <span>{isSubmitting ? 'Applying Adjustment...' : 'Apply Points Adjustment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

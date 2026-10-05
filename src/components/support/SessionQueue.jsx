import React, { useState } from 'react';
import {
  MessageSquare,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  Search,
  Filter,
  ArrowRight,
} from 'lucide-react';
import './SessionQueue.css';

export default function SessionQueue({
  sessions = [],
  selectedSessionId = null,
  onSelectSession,
  onAcceptSession,
  isChimeEnabled = true,
  onToggleChime,
}) {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pending' | 'active' | 'resolved'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      (s.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.id || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'all') return true;
    if (filterTab === 'pending') return s.status === 'pending';
    if (filterTab === 'active') return s.status === 'agent_active' || s.status === 'active';
    if (filterTab === 'resolved') return s.status === 'resolved' || s.status === 'closed';
    return true;
  });

  const pendingCount = sessions.filter((s) => s.status === 'pending').length;

  return (
    <div className="session-queue-panel" data-testid="session-queue-panel">
      {/* Header */}
      <div className="queue-header">
        <div className="queue-title-row">
          <div className="title-icon-wrap">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="queue-title">Customer Queue</h3>
            <span className="queue-sub">Live inquiries awaiting response</span>
          </div>
        </div>

        {/* Chime sound toggle (AC2) */}
        <button
          className={`chime-toggle-btn ${isChimeEnabled ? 'active' : ''}`}
          onClick={onToggleChime}
          title={isChimeEnabled ? 'Mute incoming chat chime' : 'Enable incoming chat chime'}
          data-testid="toggle-chime-btn"
          aria-label="Toggle Sound Chime"
        >
          {isChimeEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Search Bar */}
      <div className="queue-search-wrapper">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          className="queue-search-input"
          placeholder="Filter by customer, email or inquiry..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="queue-search-input"
        />
      </div>

      {/* Filter Tabs */}
      <div className="queue-filter-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={filterTab === 'all'}
          className={`tab-btn ${filterTab === 'all' ? 'active' : ''}`}
          onClick={() => setFilterTab('all')}
          data-testid="filter-tab-all"
        >
          All ({sessions.length})
        </button>
        <button
          role="tab"
          aria-selected={filterTab === 'pending'}
          className={`tab-btn tab-pending ${filterTab === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterTab('pending')}
          data-testid="filter-tab-pending"
        >
          Waiting ({pendingCount})
          {pendingCount > 0 && <span className="pending-dot" />}
        </button>
        <button
          role="tab"
          aria-selected={filterTab === 'active'}
          className={`tab-btn ${filterTab === 'active' ? 'active' : ''}`}
          onClick={() => setFilterTab('active')}
          data-testid="filter-tab-active"
        >
          Active
        </button>
        <button
          role="tab"
          aria-selected={filterTab === 'resolved'}
          className={`tab-btn ${filterTab === 'resolved' ? 'active' : ''}`}
          onClick={() => setFilterTab('resolved')}
          data-testid="filter-tab-resolved"
        >
          Resolved
        </button>
      </div>

      {/* Sessions List */}
      <div className="queue-items-list" data-testid="queue-items-list">
        {filteredSessions.length === 0 ? (
          <div className="empty-queue-state">
            <MessageSquare size={32} className="empty-icon" />
            <p className="empty-title">No conversations found</p>
            <span className="empty-sub">Incoming customer inquiries will appear here in real time.</span>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isSelected = selectedSessionId === session.id;
            const isPending = session.status === 'pending';
            const isActive = session.status === 'agent_active' || session.status === 'active';

            return (
              <div
                key={session.id}
                className={`queue-session-card ${isSelected ? 'selected' : ''} ${isPending ? 'pending' : ''}`}
                onClick={() => onSelectSession(session)}
                data-testid={`session-card-${session.id}`}
              >
                <div className="card-top-row">
                  <div className="customer-meta">
                    <div className="customer-avatar">
                      <User size={14} />
                    </div>
                    <div>
                      <span className="customer-name">{session.customer_name || 'Customer'}</span>
                      <span className="customer-email">{session.customer_email || session.customer_id}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isPending ? (
                    <span className="queue-status-badge badge-pending" data-testid="badge-pending">
                      <Clock size={11} />
                      <span>{session.waitTime || '1m ago'}</span>
                    </span>
                  ) : isActive ? (
                    <span className="queue-status-badge badge-active">
                      <span className="active-dot" />
                      <span>Live</span>
                    </span>
                  ) : (
                    <span className="queue-status-badge badge-resolved">
                      <CheckCircle size={11} />
                      <span>Closed</span>
                    </span>
                  )}
                </div>

                <div className="card-subject-row">
                  <span className="session-subject">{session.subject || 'Customer Support Request'}</span>
                  {session.lastMessage && (
                    <p className="session-last-msg">{session.lastMessage}</p>
                  )}
                </div>

                {/* Accept Chat Action Button (AC3) */}
                {isPending && (
                  <div className="card-action-row">
                    <button
                      className="accept-chat-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptSession(session);
                      }}
                      data-testid={`accept-chat-btn-${session.id}`}
                    >
                      <span>Accept Chat</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

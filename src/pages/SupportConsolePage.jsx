import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  Headphones,
  Sparkles,
  RefreshCw,
  Bell,
  Radio,
} from 'lucide-react';
import SessionQueue from '../components/support/SessionQueue';
import AgentChatStream from '../components/support/AgentChatStream';
import adminSocketService from '../services/adminSocket.service';
import './SupportConsolePage.css';

export const FALLBACK_SUPPORT_SESSIONS = [
  {
    id: 'sess-101',
    customer_id: 'cust-102',
    customer_name: 'Nimasha Fernando',
    customer_email: 'nimasha.f@outlook.com',
    subject: 'Size Exchange & Batik Shirt Availability',
    status: 'pending',
    waitTime: '2m ago',
    lastMessage: 'Could you check if size Large is available in the Ocean Indigo Batik shirt?',
    messages: [
      {
        id: 'msg-101-1',
        senderRole: 'customer',
        message: 'Hello, I submitted an exchange request earlier today.',
        createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      },
      {
        id: 'msg-101-2',
        senderRole: 'bot',
        message: 'Thank you for reaching out! A Dickwella support agent will be with you shortly.',
        createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      },
      {
        id: 'msg-101-3',
        senderRole: 'customer',
        message: 'Could you check if size Large is available in the Ocean Indigo Batik shirt?',
        createdAt: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
      },
    ],
  },
  {
    id: 'sess-102',
    customer_id: 'cust-101',
    customer_name: 'Kavindu Senanayake',
    customer_email: 'kavindu@gmail.com',
    subject: 'Courier Tracking Slpost Issue',
    status: 'agent_active',
    waitTime: '5m ago',
    lastMessage: 'Thank you for contacting Sri Lanka Post on my behalf!',
    messages: [
      {
        id: 'msg-102-1',
        senderRole: 'customer',
        message: 'Hi, my tracking number SLPOST-81100-01 has not updated in 2 days.',
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
      {
        id: 'msg-102-2',
        senderRole: 'support_agent',
        message: 'Hello Kavindu! Let me coordinate with our Matara postal hub right away.',
        createdAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
      },
      {
        id: 'msg-102-3',
        senderRole: 'customer',
        message: 'Thank you for contacting Sri Lanka Post on my behalf!',
        createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      },
    ],
  },
  {
    id: 'sess-103',
    customer_id: 'cust-103',
    customer_name: 'Thisara Perera',
    customer_email: 'thisara@yahoo.com',
    subject: 'Platinum Tier Points Check',
    status: 'resolved',
    waitTime: '1h ago',
    lastMessage: 'All clear, points credited to account.',
    messages: [
      {
        id: 'msg-103-1',
        senderRole: 'customer',
        message: 'Did my goodwill points reflection go through?',
        createdAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
      },
      {
        id: 'msg-103-2',
        senderRole: 'support_agent',
        message: 'Yes, your 250 goodwill points have been updated and tier maintained.',
        createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      },
    ],
  },
];

export default function SupportConsolePage() {
  const [sessions, setSessions] = useState(FALLBACK_SUPPORT_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState(FALLBACK_SUPPORT_SESSIONS[0].id);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [isChimeEnabled, setIsChimeEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [socketStatusMsg, setSocketStatusMsg] = useState('Connecting to WebSocket Gateway...');

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  // Play subtle web audio beep when a new pending session arrives
  const playChime = () => {
    if (!isChimeEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 note
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy ignored
    }
  };

  useEffect(() => {
    const socket = adminSocketService.connect();

    const handleConnect = () => {
      setIsConnected(true);
      setSocketStatusMsg('Connected to Live WebSocket Gateway (Port 5000)');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketStatusMsg('Disconnected: Standby mode');
    };

    const handleMessage = (data) => {
      if (!data) return;

      setSessions((prevSessions) =>
        prevSessions.map((s) => {
          if (s.id === data.sessionId) {
            const newMsg = {
              id: data.id || `msg-${Date.now()}`,
              senderRole: data.senderRole || 'customer',
              message: data.message,
              createdAt: data.createdAt || new Date().toISOString(),
            };
            return {
              ...s,
              lastMessage: data.message,
              messages: [...(s.messages || []), newMsg],
            };
          }
          return s;
        })
      );
      setIsCustomerTyping(false);
    };

    const handleTyping = (data) => {
      if (data && data.sessionId === selectedSessionId) {
        setIsCustomerTyping(Boolean(data.isTyping));
      }
    };

    const handleNewSession = (newSession) => {
      if (!newSession) return;
      playChime();
      setSessions((prev) => [newSession, ...prev]);
    };

    const unsubConnect = adminSocketService.on('connect', handleConnect);
    const unsubDisconnect = adminSocketService.on('disconnect', handleDisconnect);
    const unsubMsg = adminSocketService.on('chat:message', handleMessage);
    const unsubTyping = adminSocketService.on('chat:typing', handleTyping);
    const unsubNewSess = adminSocketService.on('support:new_session', handleNewSession);

    if (adminSocketService.isConnected) {
      handleConnect();
    }

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubMsg();
      unsubTyping();
      unsubNewSess();
    };
  }, [selectedSessionId, isChimeEnabled]);

  const handleSelectSession = (session) => {
    setSelectedSessionId(session.id);
    setIsCustomerTyping(false);
    adminSocketService.joinSession(session.id);
  };

  // Agent accepts pending chat (AC3)
  const handleAcceptSession = (session) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, status: 'agent_active' } : s))
    );
    setSelectedSessionId(session.id);
    adminSocketService.joinSession(session.id);
  };

  // Agent sends message
  const handleSendMessage = (messageText) => {
    if (!activeSession || !messageText) return;

    const newMsg = {
      id: `agent-${Date.now()}`,
      senderRole: 'support_agent',
      message: messageText,
      createdAt: new Date().toISOString(),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            lastMessage: messageText,
            messages: [...(s.messages || []), newMsg],
          };
        }
        return s;
      })
    );

    adminSocketService.sendMessage(activeSession.id, messageText);
  };

  const handleTyping = (isTyping) => {
    if (activeSession) {
      adminSocketService.sendTyping(activeSession.id, isTyping);
    }
  };

  const handleResolveSession = (session) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, status: 'resolved' } : s))
    );
  };

  // KPI calculations
  const pendingCount = sessions.filter((s) => s.status === 'pending').length;
  const activeCount = sessions.filter(
    (s) => s.status === 'agent_active' || s.status === 'active'
  ).length;
  const resolvedCount = sessions.filter(
    (s) => s.status === 'resolved' || s.status === 'closed'
  ).length;

  return (
    <div className="support-console-page" data-testid="support-console-page">
      {/* Page Header */}
      <div className="support-header">
        <div>
          <div className="support-kicker">
            <span className="support-badge">
              <Radio size={12} className={isConnected ? 'radio-pulse' : ''} />
              <span>{isConnected ? 'LIVE AGENT QUEUE' : 'GATEWAY STANDBY'}</span>
            </span>
            <span className="support-tag">FR-024 / SDS §12.2 • Module Owner: S. Thanoogithan</span>
          </div>
          <h1 className="support-title">Real-Time Support Agent Console</h1>
          <p className="support-subtitle">
            Accept incoming customer chat sessions, answer inquiries, and exchange live messages with real-time typing indicators.
          </p>
        </div>

        <div className="support-status-chip">
          <span className={`status-dot ${isConnected ? 'dot-online' : 'dot-standby'}`} />
          <span className="status-text">{socketStatusMsg}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="support-kpi-grid">
        <div className="support-kpi-card" data-testid="kpi-waiting-queue">
          <div className="kpi-icon-wrap waiting">
            <Clock size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Waiting in Queue</span>
            <span className="kpi-val font-mono">{pendingCount}</span>
            <span className="kpi-sub">{pendingCount > 0 ? 'Action Required' : 'Queue Empty'}</span>
          </div>
        </div>

        <div className="support-kpi-card" data-testid="kpi-active-chats">
          <div className="kpi-icon-wrap active">
            <Headphones size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Active Conversations</span>
            <span className="kpi-val font-mono">{activeCount}</span>
            <span className="kpi-sub">Assigned to Agents</span>
          </div>
        </div>

        <div className="support-kpi-card" data-testid="kpi-resolved-today">
          <div className="kpi-icon-wrap resolved">
            <CheckCircle size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Resolved Inquiries</span>
            <span className="kpi-val font-mono">{resolvedCount}</span>
            <span className="kpi-sub">Today's Completed Chats</span>
          </div>
        </div>

        <div className="support-kpi-card" data-testid="kpi-avg-response">
          <div className="kpi-icon-wrap response">
            <Sparkles size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Avg Response Speed</span>
            <span className="kpi-val font-mono">38s</span>
            <span className="kpi-sub">Sub-minute SLA</span>
          </div>
        </div>
      </div>

      {/* Dual Panel Layout (AC1) */}
      <div className="support-dual-panel">
        <div className="queue-column">
          <SessionQueue
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
            onAcceptSession={handleAcceptSession}
            isChimeEnabled={isChimeEnabled}
            onToggleChime={() => setIsChimeEnabled((prev) => !prev)}
          />
        </div>

        <div className="stream-column">
          <AgentChatStream
            session={activeSession}
            messages={activeSession?.messages || []}
            isCustomerTyping={isCustomerTyping}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onResolveSession={handleResolveSession}
          />
        </div>
      </div>
    </div>
  );
}

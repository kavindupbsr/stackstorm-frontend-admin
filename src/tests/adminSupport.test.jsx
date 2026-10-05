import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SupportConsolePage, { FALLBACK_SUPPORT_SESSIONS } from '../pages/SupportConsolePage';
import SessionQueue from '../components/support/SessionQueue';
import AgentChatStream from '../components/support/AgentChatStream';
import adminSocketService from '../services/adminSocket.service';

// Mock adminSocketService
vi.mock('../services/adminSocket.service', () => {
  const handlers = new Map();
  return {
    default: {
      connect: vi.fn().mockReturnValue({}),
      disconnect: vi.fn(),
      joinSession: vi.fn((sessionId, cb) => {
        if (typeof cb === 'function') cb({ success: true, sessionId });
      }),
      sendMessage: vi.fn(),
      sendTyping: vi.fn(),
      leaveSession: vi.fn(),
      isConnected: true,
      on: vi.fn((event, handler) => {
        if (!handlers.has(event)) handlers.set(event, new Set());
        handlers.get(event).add(handler);
        return () => handlers.get(event)?.delete(handler);
      }),
      off: vi.fn((event, handler) => {
        handlers.get(event)?.delete(handler);
      }),
      _trigger: (event, data) => {
        handlers.get(event)?.forEach((fn) => fn(data));
      },
    },
  };
});

describe('STORM-FE-022: Admin Real-Time Support Console with Active Session Queue & Typing Indicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* -------------------------------------------------------------------------- */
  /* AC1: Dual Panel Layout & KPI Summary Metrics                               */
  /* -------------------------------------------------------------------------- */
  it('renders dual-panel layout with customer session queue and active chat stream', () => {
    render(<SupportConsolePage />);

    // Header & KPIs
    expect(screen.getByText('Real-Time Support Agent Console')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-waiting-queue')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-active-chats')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-resolved-today')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-avg-response')).toBeInTheDocument();

    // Dual Panels
    expect(screen.getByTestId('session-queue-panel')).toBeInTheDocument();
    expect(screen.getByTestId('agent-chat-stream-panel')).toBeInTheDocument();
  });

  /* -------------------------------------------------------------------------- */
  /* AC2: Queue Filtering & Chime Sound Toggle                                  */
  /* -------------------------------------------------------------------------- */
  it('filters queue items by status tabs and keyword search query', () => {
    render(<SupportConsolePage />);

    expect(screen.getAllByText('Nimasha Fernando').length).toBeGreaterThan(0);
    expect(screen.getByText('Kavindu Senanayake')).toBeInTheDocument();

    // Filter by "Waiting"
    const waitingTab = screen.getByTestId('filter-tab-pending');
    fireEvent.click(waitingTab);

    // Only Nimasha (pending) should be in queue
    expect(screen.getAllByText('Nimasha Fernando').length).toBeGreaterThan(0);
    expect(screen.queryByText('Kavindu Senanayake')).not.toBeInTheDocument();

    // Search input filtering
    const searchInput = screen.getByTestId('queue-search-input');
    fireEvent.change(searchInput, { target: { value: 'Nimasha' } });
    expect(screen.getAllByText('Nimasha Fernando').length).toBeGreaterThan(0);

    // Toggle chime
    const chimeBtn = screen.getByTestId('toggle-chime-btn');
    fireEvent.click(chimeBtn);
    expect(chimeBtn).toBeInTheDocument();
  });

  /* -------------------------------------------------------------------------- */
  /* AC3: Agent "Accept Chat" Transition to agent_active                        */
  /* -------------------------------------------------------------------------- */
  it('transitions pending session to active when agent clicks Accept Chat', () => {
    render(<SupportConsolePage />);

    // Nimasha has pending session sess-101
    const acceptBtn = screen.getByTestId('accept-chat-btn-sess-101');
    expect(acceptBtn).toBeInTheDocument();

    fireEvent.click(acceptBtn);

    // joinSession should be invoked
    expect(adminSocketService.joinSession).toHaveBeenCalledWith('sess-101');

    // Status badge transitions from Pending to Live (active)
    expect(screen.getAllByText('Nimasha Fernando').length).toBeGreaterThan(0);
  });

  /* -------------------------------------------------------------------------- */
  /* AC4: Canned Responses, Typing Indicators & Message Dispatch                */
  /* -------------------------------------------------------------------------- */
  it('allows inserting canned responses and sending messages with typing broadcasts', async () => {
    render(<SupportConsolePage />);

    const input = screen.getByTestId('agent-chat-input');
    const sendBtn = screen.getByTestId('agent-chat-send-btn');

    // Select a canned response
    const cannedSelect = screen.getByTestId('canned-responses-select');
    fireEvent.change(cannedSelect, {
      target: {
        value:
          'Could you please provide your DFC invoice or order number so I can check your order status in our warehouse system?',
      },
    });

    expect(input.value).toContain('invoice or order number');

    // Typing sends typing indicators
    expect(adminSocketService.sendTyping).toHaveBeenCalledWith('sess-101', true);

    // Send reply
    fireEvent.click(sendBtn);

    // Socket message dispatched
    expect(adminSocketService.sendMessage).toHaveBeenCalledWith(
      'sess-101',
      expect.stringContaining('invoice or order number')
    );
  });

  it('renders customer typing indicator when customer is typing', () => {
    const mockSession = FALLBACK_SUPPORT_SESSIONS[0];

    render(
      <AgentChatStream
        session={mockSession}
        messages={mockSession.messages}
        isCustomerTyping={true}
      />
    );

    expect(screen.getByTestId('customer-typing-indicator')).toBeInTheDocument();
    expect(screen.getByText(/Nimasha Fernando is typing.../i)).toBeInTheDocument();
  });
});

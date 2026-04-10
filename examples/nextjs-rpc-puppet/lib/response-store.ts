export interface ResponseSnapshot {
  queuedSpeech: string | null;
  queuedAt: string | null;
  deliveredSpeech: string | null;
  deliveryCount: number;
}

export interface SessionEvent {
  type: 'queued' | 'delivered' | 'empty';
  sessionId: string;
  time: string;
  speech?: string;
  reason?: string;
  lastUserMessage?: string;
}

interface SessionState {
  queuedSpeech: string | null;
  queuedAt: string | null;
  deliveredSpeech: string | null;
  deliveryCount: number;
}

const sessions = new Map<string, SessionState>();
const listeners = new Map<string, Set<(event: SessionEvent) => void>>();

function ensureSession(sessionId: string): SessionState {
  let state = sessions.get(sessionId);
  if (!state) {
    state = {
      queuedSpeech: null,
      queuedAt: null,
      deliveredSpeech: null,
      deliveryCount: 0,
    };
    sessions.set(sessionId, state);
  }
  return state;
}

function emit(sessionId: string, event: Omit<SessionEvent, 'sessionId' | 'time'>) {
  const fullEvent: SessionEvent = {
    sessionId,
    time: new Date().toISOString(),
    ...event,
  };
  for (const listener of listeners.get(sessionId) ?? []) {
    listener(fullEvent);
  }
}

export function initializeSession(sessionId: string, openingSpeech?: string) {
  const state = ensureSession(sessionId);
  const normalized = openingSpeech?.trim() || null;
  state.queuedSpeech = normalized;
  state.queuedAt = normalized ? new Date().toISOString() : null;

  if (normalized) {
    emit(sessionId, { type: 'queued', speech: normalized });
  }
}

export function queueSpeech(sessionId: string, speech: string): ResponseSnapshot {
  const state = ensureSession(sessionId);
  const normalized = speech.trim();
  state.queuedSpeech = normalized || null;
  state.queuedAt = normalized ? new Date().toISOString() : null;

  emit(sessionId, {
    type: 'queued',
    speech: state.queuedSpeech ?? '',
  });

  return snapshot(sessionId);
}

export function consumeSpeech(
  sessionId: string,
  args: { reason?: unknown; lastUserMessage?: unknown },
) {
  const state = ensureSession(sessionId);
  const reason = typeof args.reason === 'string' ? args.reason : undefined;
  const lastUserMessage =
    typeof args.lastUserMessage === 'string' ? args.lastUserMessage : undefined;

  const speech = state.queuedSpeech?.trim() ?? '';

  if (!speech) {
    emit(sessionId, {
      type: 'empty',
      reason,
      lastUserMessage,
    });
    return {
      shouldReply: false,
      speech: '',
    };
  }

  state.queuedSpeech = null;
  state.queuedAt = null;
  state.deliveredSpeech = speech;
  state.deliveryCount += 1;

  emit(sessionId, {
    type: 'delivered',
    speech,
    reason,
    lastUserMessage,
  });

  return {
    shouldReply: true,
    speech,
  };
}

export function snapshot(sessionId: string): ResponseSnapshot {
  const state = ensureSession(sessionId);
  return {
    queuedSpeech: state.queuedSpeech,
    queuedAt: state.queuedAt,
    deliveredSpeech: state.deliveredSpeech,
    deliveryCount: state.deliveryCount,
  };
}

export function subscribeToSession(
  sessionId: string,
  listener: (event: SessionEvent) => void,
) {
  const sessionListeners = listeners.get(sessionId) ?? new Set();
  sessionListeners.add(listener);
  listeners.set(sessionId, sessionListeners);
  return () => {
    sessionListeners.delete(listener);
    if (sessionListeners.size === 0) {
      listeners.delete(sessionId);
    }
  };
}

export function cleanupSession(sessionId: string) {
  sessions.delete(sessionId);
  listeners.delete(sessionId);
}

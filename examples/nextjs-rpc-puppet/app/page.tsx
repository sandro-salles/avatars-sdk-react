'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import {
  AvatarCall,
  AvatarVideo,
  ControlBar,
  useTranscription,
} from '@runwayml/avatars-react';
import type { TranscriptionEntry } from '@runwayml/avatars-react';
import '@runwayml/avatars-react/styles.css';

const AVATAR_ID = process.env.NEXT_PUBLIC_AVATAR_ID!;
const DEFAULT_OPENING_SPEECH =
  'Oi. Eu estou em modo puppet. Antes de cada resposta, eu consulto meu backend para buscar exatamente o que devo falar.';

interface SessionData {
  sessionId: string;
  sessionKey: string;
}

interface ResponseSnapshot {
  queuedSpeech: string | null;
  queuedAt: string | null;
  deliveredSpeech: string | null;
  deliveryCount: number;
}

interface SessionEvent {
  type: 'connected' | 'queued' | 'delivered' | 'empty';
  time: string;
  speech?: string;
  reason?: string;
  lastUserMessage?: string;
}

export default function Home() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [openingSpeech, setOpeningSpeech] = useState(DEFAULT_OPENING_SPEECH);

  async function handleConnect() {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/avatar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: AVATAR_ID,
          openingSpeech,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
      setSession(data);
    } catch (error) {
      console.error('Failed to connect:', error);
      setIsConnecting(false);
    }
  }

  if (!session) {
    return (
      <main className="page">
        <section className="hero">
          <span className="eyebrow">Backend RPC Puppet Pattern</span>
          <h1 className="title">Keep the brain outside the avatar.</h1>
          <p className="subtitle">
            This demo makes the avatar call a single backend tool named
            <code> get_response </code>
            before it speaks. The backend decides the line. The avatar just renders it.
          </p>
          <div className="composer">
            <label className="label" htmlFor="openingSpeech">
              Opening line queued on the backend
            </label>
            <textarea
              id="openingSpeech"
              className="textarea"
              value={openingSpeech}
              onChange={(event) => setOpeningSpeech(event.target.value)}
              placeholder="Write the first line the avatar should speak"
            />
          </div>
          <div className="actions">
            <button className="button" onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? 'Creating session...' : 'Start puppet session'}
            </button>
          </div>
          <p className="hint">
            If the avatar does not speak immediately after connect, say anything short to
            trigger a turn. The queued line still comes from the backend.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <Suspense fallback={<div className="empty-state">Connecting...</div>}>
        <PuppetSession
          session={session}
          onEnd={() => {
            setSession(null);
            setIsConnecting(false);
          }}
        />
      </Suspense>
    </main>
  );
}

function PuppetSession(props: { session: SessionData; onEnd: () => void }) {
  const { session, onEnd } = props;
  const [draftSpeech, setDraftSpeech] = useState(
    'Perfeito. Esta resposta veio do meu backend, nao da minha improvisacao local.',
  );
  const [status, setStatus] = useState<ResponseSnapshot | null>(null);
  const [events, setEvents] = useState<Array<SessionEvent>>([]);
  const [transcripts, setTranscripts] = useState<Array<TranscriptionEntry>>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      const res = await fetch(`/api/avatar/response?sessionId=${session.sessionId}`);
      const data = (await res.json()) as ResponseSnapshot;
      if (!cancelled) setStatus(data);
    }
    loadStatus().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [session.sessionId]);

  useEffect(() => {
    const source = new EventSource(`/api/avatar/events?sessionId=${session.sessionId}`);
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as SessionEvent;
        setEvents((prev) => [event, ...prev].slice(0, 30));
        if (event.type === 'queued') {
          setStatus((prev) =>
            prev
              ? {
                  ...prev,
                  queuedSpeech: event.speech ?? null,
                  queuedAt: event.time,
                }
              : prev,
          );
        }
        if (event.type === 'delivered') {
          setStatus((prev) =>
            prev
              ? {
                  ...prev,
                  queuedSpeech: null,
                  queuedAt: null,
                  deliveredSpeech: event.speech ?? null,
                  deliveryCount: prev.deliveryCount + 1,
                }
              : prev,
          );
        }
      } catch (error) {
        console.error('Failed to parse event', error);
      }
    };
    source.onerror = () => source.close();
    return () => source.close();
  }, [session.sessionId]);

  async function queueNextResponse() {
    setIsSaving(true);
    try {
      const res = await fetch('/api/avatar/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          speech: draftSpeech,
        }),
      });
      const data = (await res.json()) as ResponseSnapshot & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
      setStatus(data);
    } catch (error) {
      console.error('Failed to queue response:', error);
    } finally {
      setIsSaving(false);
    }
  }

  const eventSummary = useMemo(() => {
    if (!status) return null;
    return [
      {
        label: 'Queued now',
        value: status.queuedSpeech ? 'Yes' : 'No',
        detail: status.queuedSpeech ?? 'No speech waiting on the backend.',
      },
      {
        label: 'Last delivered',
        value: status.deliveredSpeech ? 'Available' : 'None yet',
        detail: status.deliveredSpeech ?? 'Nothing has been consumed by the avatar yet.',
      },
      {
        label: 'Delivery count',
        value: String(status.deliveryCount),
        detail: 'How many queued lines have already been spoken.',
      },
    ];
  }, [status]);

  return (
    <div className="call-grid">
      <section className="stack">
        <div className="card avatar-shell">
          <div className="avatar-stage">
            <AvatarCall
              avatarId={AVATAR_ID}
              sessionId={session.sessionId}
              sessionKey={session.sessionKey}
              video={false}
              onEnd={onEnd}
              onError={console.error}
            >
              <AvatarVideo />
              <ControlBar />
              <TranscriptObserver onEntry={(entry) => {
                setTranscripts((prev) => [entry, ...prev].slice(0, 40));
              }} />
            </AvatarCall>
          </div>
        </div>

        <div className="card pad">
          <div className="composer">
            <span className="pill">Queue the next line on the backend</span>
            <label className="label" htmlFor="nextSpeech">
              Next speech for <code>get_response</code>
            </label>
            <textarea
              id="nextSpeech"
              className="textarea"
              value={draftSpeech}
              onChange={(event) => setDraftSpeech(event.target.value)}
              placeholder="Write the exact line the avatar should speak next"
            />
            <div className="actions">
              <button className="button" onClick={queueNextResponse} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Queue next response'}
              </button>
              <button className="button ghost" onClick={onEnd}>
                End session
              </button>
            </div>
            <p className="session-note">
              After you queue a line, say anything short to the avatar if you need to
              trigger another turn. The demo is intentionally explicit about the handoff.
            </p>
          </div>
        </div>
      </section>

      <aside className="stack">
        <div className="card pad">
          <h2 className="card-title">Backend state</h2>
          {eventSummary ? (
            <div className="status-grid">
              {eventSummary.map((item) => (
                <div key={item.label} className="status-item">
                  <strong>{item.label}</strong>
                  <span className="pill muted-pill">{item.value}</span>
                  <p className="session-note">{item.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">Loading backend state...</p>
          )}
        </div>

        <div className="card pad">
          <h2 className="card-title">Backend events</h2>
          <div className="panel-list">
            {events.length === 0 ? (
              <p className="empty-state">No backend events yet.</p>
            ) : (
              events.map((event, index) => (
                <div key={`${event.time}-${index}`} className="log-item">
                  <small>{new Date(event.time).toLocaleTimeString()}</small>
                  <strong>{event.type}</strong>
                  {event.speech ? <code>{event.speech}</code> : null}
                  {event.reason ? (
                    <p className="session-note">reason: {event.reason}</p>
                  ) : null}
                  {event.lastUserMessage ? (
                    <p className="session-note">
                      last user message: {event.lastUserMessage}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card pad">
          <h2 className="card-title">Transcription</h2>
          <div className="panel-list">
            {transcripts.length === 0 ? (
              <p className="empty-state">No transcription yet.</p>
            ) : (
              transcripts.map((entry) => (
                <div key={entry.id} className="log-item">
                  <small>{entry.participantIdentity}</small>
                  <div>{entry.text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function TranscriptObserver(props: { onEntry: (entry: TranscriptionEntry) => void }) {
  useTranscription(props.onEntry);
  return null;
}

# Backend-Controlled Avatar

An AI avatar that is deliberately constrained: before it speaks, it calls a single **backend RPC** tool named `get_response`. Your backend decides the next line and the avatar reads it.

## What it demonstrates

- **Backend RPC as the source of truth** - the avatar fetches speech from your server instead of inventing it
- **Queued speech** - you can stage the next line from the UI and let the avatar consume it on the next turn
- **Observable control flow** - the demo shows both transcription and backend events so you can see when the tool fired and what it returned

## Tool

| Tool | Type | What it does |
|------|------|-------------|
| `get_response` | `backend_rpc` | Returns the next line the avatar should speak; intended to be the avatar's only source of truth |

## How it works

1. The client asks your server to create a realtime session.
2. The server creates a Runway session and starts an RPC handler for `get_response`.
3. The UI can queue a line of speech for that session.
4. When the avatar decides it is time to respond, it calls `get_response`.
5. The backend returns the queued line and clears it.
6. The avatar speaks that line.

This pattern is the starting point for a larger system where the "brain" lives outside the avatar runtime. The avatar stays on camera; your backend decides the content.

## Quick start

```bash
npx degit runwayml/avatars-sdk-react/examples/nextjs-rpc-puppet my-puppet-app
cd my-puppet-app
cp .env.example .env.local
# Add your RUNWAYML_API_SECRET and NEXT_PUBLIC_AVATAR_ID

npm install
npm run dev
```

## Notes

- This example uses in-memory storage. It is fine for a demo, not for production.
- The personality tells the avatar to call `get_response` before any spoken reply and to read the returned `speech` exactly, but the underlying model still ultimately decides whether it obeys perfectly.
- If the avatar does not speak immediately after connect, say anything short to trigger a turn. The first queued line will still be used.

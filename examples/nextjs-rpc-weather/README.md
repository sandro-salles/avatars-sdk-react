# Weather Assistant — Backend RPC Example

An AI avatar that looks up real-time weather data using **backend RPC tool calls**. Ask about the weather in any city and the avatar speaks the results back.

## What it demonstrates

- **Backend RPC tools** — the avatar triggers server-side functions via `@runwayml/avatars-node-rpc`
- **`createRpcHandler`** — listens for tool calls on the LiveKit data channel and responds with results
- **Personality & start script** — custom persona that guides the conversation

## Tools

| Tool | What it does |
|------|-------------|
| `get_weather` | Looks up current weather conditions (temperature, humidity, wind) for a given city |

## Setup

```bash
npx degit runwayml/avatars-sdk-react/examples/nextjs-rpc-weather my-weather-app
cd my-weather-app
cp .env.example .env.local
# Add your RUNWAYML_API_SECRET and NEXT_PUBLIC_AVATAR_ID

npm install
npm run dev
```

## Architecture

```
lib/personality.ts              (weather persona)
lib/weather-database.ts         (mock weather data)
      │
      └── app/api/.../route.ts   (server: creates session + RPC handler)
      └── app/page.tsx           (client: AvatarCall + video + controls)
```

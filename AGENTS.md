# Agent Guidelines

Context for AI agents working with `@runwayml/avatars-react` - a React SDK for real-time AI avatar interactions via WebRTC.

## Quick Reference

| Resource | Location |
|----------|----------|
| Package README | `README.md` |
| Next.js example | `examples/nextjs/` |
| Types | `src/types.ts` |

## Architecture

```
src/
├── components/    # Headless React components with render props
├── hooks/         # useAvatarSession, useAvatar, useLocalMedia
├── api/           # Session consumption endpoint
├── types.ts       # SessionCredentials, SessionState, Props types
└── index.ts       # Public exports
```

## Component Hierarchy

```
AvatarCall (handles session creation)
└── AvatarSession (WebRTC provider)
    ├── AvatarVideo (remote avatar)
    ├── UserVideo (local camera)
    ├── ControlBar (mic/camera/end)
    └── ScreenShareVideo
```

## Key Patterns

**Session states:** `idle` → `connecting` → `active` → `ending` → `ended` (or `error`)

**Render props:** All display components accept `children` as render function:
```tsx
<AvatarVideo>
  {(avatar) => {
    switch (avatar.status) {
      case 'connecting': return <Spinner />;
      case 'waiting': return <Placeholder />;
      case 'ready': return <VideoTrack trackRef={avatar.videoTrackRef} />;
    }
  }}
</AvatarVideo>
```

**Hooks require context:** Must be inside `<AvatarCall>` or `<AvatarSession>`

## Components

| Component | Purpose |
|-----------|---------|
| `AvatarCall` | High-level component, handles session creation |
| `AvatarSession` | Low-level, requires pre-fetched credentials |
| `AvatarVideo` | Renders remote avatar video |
| `UserVideo` | Renders local camera |
| `ControlBar` | Mic/camera/end-call buttons |
| `ScreenShareVideo` | Renders screen share |

## Hooks

| Hook | Purpose |
|------|---------|
| `useAvatarStatus` | Discriminated union of full avatar lifecycle (recommended) |
| `useAvatarSession` | Session state and `end()` control |
| `useAvatar` | Remote avatar video track |
| `useLocalMedia` | Local mic/camera toggles |

## Commands

```bash
bun run dev        # Watch mode
bun run build      # Build package
bun run typecheck  # TypeScript check
bun run lint       # Biome linter
bun test           # Run tests
```

## Source Files

| Purpose | Path |
|---------|------|
| All types | `src/types.ts` |
| High-level component | `src/components/AvatarCall.tsx` |
| Session provider | `src/components/AvatarSession.tsx` |
| Avatar video | `src/components/AvatarVideo.tsx` |
| User video | `src/components/UserVideo.tsx` |
| Controls | `src/components/ControlBar.tsx` |
| Session hook | `src/hooks/useAvatarSession.ts` |
| Avatar hook | `src/hooks/useAvatar.ts` |
| Media hook | `src/hooks/useLocalMedia.ts` |
| Server example | `examples/nextjs/app/api/avatar/connect/route.ts` |

## Learned Workspace Facts

- Release flow follows `CONTRIBUTING.md` — bump version, update changelog, commit, push, then `gh release create` triggers the NPM publish workflow
- `consumeSession` API converts `sessionId + sessionKey` → WebRTC credentials (`serverUrl`, `token`, `roomName`); this step is handled client-side by the SDK
- Primary quickstart reference is `examples/nextjs/` (API routes, more universally understood than server actions)
- Documentation lives on an external docs website — `docs/` and `skills/` folders were intentionally removed from the repo

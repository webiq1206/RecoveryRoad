# IA Strict Redirect Smoke Checklist

Use this checklist when `EXPO_PUBLIC_ENABLE_STRICT_IA_REDIRECTS=1`.

## How to Run

1. Start the app in dev mode with strict redirects enabled.
2. Navigate directly to each legacy path (deep link or manual route entry).
3. Confirm you land on the expected canonical path.
4. Confirm app behavior is unchanged after redirect (screen loads, actions work).
5. In dev logs, confirm redirect resolution logs appear for tested routes.

## Legacy -> Canonical Paths

- `/(tabs)/community` -> `/connection`
- `/(tabs)/connection` -> `/connection`
- `/(tabs)/support` -> `/support`
- `/(tabs)/rebuild` -> `/rebuild`
- `/(tabs)/profile` -> `/profile`
- `/(tabs)/progress` -> `/progress`
- `/(tabs)/journal` -> `/journal`
- `/(tabs)/triggers` -> `/triggers`
- `/(tabs)/milestones` -> `/milestones`
- `/(tabs)/accountability` -> `/accountability`
- `/(tabs)/pledges` -> `/pledges`
- `/(tabs)/connection/recovery-rooms` -> `/recovery-rooms`
- `/(tabs)/connection/room-session` -> `/room-session`
- `/(tabs)/(home)` -> `/home`
- `/(tabs)/(home)/today-hub` -> `/home`

## Critical Flow Smoke Cases

- Crisis entry still works from `/home` and `today-hub`-driven actions.
- `Connection` hub loads from both legacy and canonical paths.
- Recovery rooms flow works end-to-end:
  - open rooms list
  - join/enter room
  - session opens
- Removed-tab features still open correctly from canonical paths:
  - `/progress`, `/journal`, `/triggers`, `/milestones`, `/accountability`

## Pass Criteria

- Every legacy route resolves to the mapped canonical route.
- No redirect loops.
- No blank screen or crash after redirect.
- Core user actions on destination screens still function.

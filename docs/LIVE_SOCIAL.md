# Live community & recovery rooms

This app supports **three modes** (see `core/socialLiveConfig.ts`):

| Mode | When | Behavior |
|------|------|----------|
| **live** | Release: `EXPO_PUBLIC_LIVE_SOCIAL_API_URL` is **`https://` only**, **`EXPO_PUBLIC_COMMUNITY_ENABLED`** is `true` / `1` / `on`, and the URL resolves. Dev (`__DEV__`): same URL check but `http://` is allowed for LAN testing. | Community and Recovery Rooms use your backend. Messages are from real users on that server. Reports, blocks, moderation, rate limits, and crisis-language flags run server-side. |
| **local_demo** | Metro `__DEV__` and no live URL, and `EXPO_PUBLIC_ALLOW_LOCAL_SOCIAL_DEMO` is not `false` | Optional seeded AsyncStorage content and **simulated** room replies for engineering only. **Never** used in production release binaries (`__DEV__` is false). |
| **offline** | No live community (typical App Store / Play release from this repo’s `production` EAS profile) | No sample users or posts; peers/rooms tabs stay minimal until you opt in. |

**Default store posture (State A):** `eas.json` production sets `EXPO_PUBLIC_COMMUNITY_ENABLED=false`. To ship **State B** (live UGC), set EAS secrets to `true`, add a **HTTPS** `EXPO_PUBLIC_LIVE_SOCIAL_API_URL`, and run the hardened social server below.

## Social API server

Run from the repo root:

```bash
npm run social-server
```

Defaults to port **3847**. State is persisted in **SQLite** as `social.db` under `backend/social/data/` (overridable with `SOCIAL_DATA_DIR`). If an older `social-state.json` file is present and the database is empty, it is imported once and the JSON file is renamed aside.

### Environment

| Variable | Purpose |
|----------|---------|
| `NODE_ENV=production` | Requires `SOCIAL_JWT_SECRET`. |
| `SOCIAL_JWT_SECRET` | Signs end-user session JWTs (required in production). |
| `SOCIAL_DEV_JWT_SECRET` | Optional stable JWT secret for non-production when you do not want tokens to reset on every server restart. |
| `SOCIAL_ADMIN_SECRET` | Enables moderation admin routes (`Authorization: Bearer …`). |
| `SOCIAL_REQUIRE_FORWARDED_TLS` | Set to `1` in production **behind TLS** to reject requests unless `X-Forwarded-Proto: https`. |
| `SOCIAL_ALLOWED_ORIGINS` | Optional comma-separated browser origins for CORS (native-only deployments often omit). |

### Authentication (production-oriented)

`POST /v1/auth/session` expects JSON:

- **`clientBindingId`** (required): stable per-install id (16+ chars, `[a-zA-Z0-9_-]+`). The app stores this in **SecureStore** (`services/liveSocialClient.ts`).
- **`appAccountId`** (optional): same value as RevenueCat’s anonymous app user id (`rc_user_id` in AsyncStorage) when available, so reinstalls can re-link the same social profile.

The server binds accounts by `app_account_id` first, then `device_id` (binding), and creates users on first contact.

### User safety (implemented in this server)

- **Rate limits** — room messages, community posts/comments, reports, and auth-by-IP (see `backend/social/server.mjs`).
- **Spam / abuse** — duplicate identical content rejection plus pattern rejects (links, repetitive characters, common spam phrases).
- **Blocking** — recovery-room blocks (names + ids) **and** community user blocks (`community_user_blocks`). Blocked authors’ **room messages** are omitted for the blocker server-side; community **posts/comments/users** lists are filtered for the viewer.
- **Reporting** — room message and user reports include **snapshots** when the message still exists; community reports for posts/comments; automated **crisis-language** rows are queued when heuristics match.
- **Posting restriction** — admins can restrict an account from creating new posts or messages.
- **Data deletion** — admin route removes a user and their authored content (see below).

### Admin & moderation (requires `SOCIAL_ADMIN_SECRET`)

Send **`Authorization: Bearer <SOCIAL_ADMIN_SECRET>`** on every admin request (separate from end-user session JWTs).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/admin/reports` | List moderation queue items |
| PATCH | `/v1/admin/reports/:id` | Body: `{ "status": "reviewed" \| "resolved", "notes": "…" }` |
| POST | `/v1/admin/moderation/hide-room-message` | Body: `{ "roomId", "messageId" }` — redacts message |
| POST | `/v1/admin/moderation/hide-community-post` | Body: `{ "postId" }` |
| POST | `/v1/admin/moderation/hide-community-comment` | Body: `{ "commentId" }` |
| POST | `/v1/admin/moderation/restrict-user` | Body: `{ "userId", "restrict": true \| false }` |
| POST | `/v1/admin/users/:userId/delete-data` | Deletes user row, authored posts/comments/messages, follows, blocks, and reports **where `reporterId` matches** (adjust for your retention policy). |

### End-user safety routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/me/blocks` | Room blocks + `communityBlockedUserIds` |
| POST | `/v1/me/blocks` | Add room block (`authorName` / `authorId`) |
| POST | `/v1/me/community-blocks` | Body `{ "blockedUserId" }` — hide that user’s community content for this account |

### App configuration

1. Run the server on a host reachable from devices (TLS-terminated reverse proxy in production).
2. Set EAS / `.env`:

```bash
EXPO_PUBLIC_LIVE_SOCIAL_API_URL=https://social.example.com
EXPO_PUBLIC_COMMUNITY_ENABLED=true
EXPO_PUBLIC_SUPPORT_EMAIL=support@example.com
# optional:
# EXPO_PUBLIC_SUPPORT_URL=https://example.com/help
```

For **Android** with an `http://` URL (dev only), the native app must allow cleartext traffic at **build** time. Release and preview builds keep cleartext **off** by default (`app.config.js`). Only enable it when you truly need HTTP:

- **EAS `development` profile** sets `EXPO_ANDROID_ALLOW_CLEARTEXT=1` in `eas.json` (internal dev client + LAN servers).
- **Production / Play:** use **`https://`** only; release binaries **reject** `http://` social URLs.

3. Rebuild the dev client or release binary so the env vars are embedded.

### Production hardening checklist

- Terminate **TLS** in front of the API; set **`SOCIAL_REQUIRE_FORWARDED_TLS=1`** so plain HTTP cannot bypass the edge.
- Back up **`social.db`** on a schedule that matches your **retention** policy (define retention and deletion with legal/clinical stakeholders).
- Map **Sign in with Apple** or another IdP to `appAccountId` when you outgrow RevenueCat anonymous ids.
- Connect admin routes to **internal tooling**, SSO, and audit logging; rotate **`SOCIAL_ADMIN_SECRET`** and **`SOCIAL_JWT_SECRET`** on compromise.
- Define **retention**, appeals, and crisis escalation with your legal and clinical teams.

The mobile app **polls** the API in live mode; for large communities, add WebSockets or push and adjust battery/network expectations accordingly.

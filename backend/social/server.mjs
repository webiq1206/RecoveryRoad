/**
 * Reference live social API for Recovery Companion (community + recovery rooms).
 *
 * Run: `npm run social-server` from repo root.
 * Point the app at it: EXPO_PUBLIC_LIVE_SOCIAL_API_URL=http://<LAN-IP>:3847
 *
 * This is an in-memory MVP for development and staging. Production needs:
 * persistent DB, TLS, auth (OAuth), rate limits, human moderation tooling, abuse SLAs, and retention policies.
 */

import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT || 3847);
const ADMIN_SECRET = process.env.SOCIAL_ADMIN_SECRET || '';

/** @type {Map<string, { userId: string }>} */
const sessions = new Map();

/** @type {Map<string, any>} */
const users = new Map();

/** @type {Map<string, Set<string>>} */
const roomMembers = new Map();

/** @type {Map<string, any[]>} */
const roomMessages = new Map();

/** @type {Map<string, { names: Set<string>, ids: Set<string> }>} */
const roomBlocksByUser = new Map();

function getRoomBlocks(userId) {
  let b = roomBlocksByUser.get(userId);
  if (!b) {
    b = { names: new Set(), ids: new Set() };
    roomBlocksByUser.set(userId, b);
  }
  return b;
}

/** @type {any[]} */
const communityPosts = [];

/** @type {any[]} */
const communityComments = [];

/** @type {any[]} */
const communityGroups = [];

/** @type {any[]} */
const moderationReports = [];

const AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';

function roomTemplates() {
  return [
    {
      id: 'rr_live_1',
      name: 'Morning Circle',
      description:
        'Start your day grounded with others who understand. Share intentions, gratitude, or just listen.',
      topic: 'general',
      memberCount: 0,
      maxMembers: 50,
      isJoined: false,
      isAnonymous: false,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      scheduledSessions: [],
      messages: [],
      rules: [
        'Be kind and respectful at all times',
        'What is shared here stays here',
        'No advice unless asked — listen and support',
        'Use “I” statements when sharing',
        'Respect the group flow',
      ],
      isLive: true,
      currentSessionId: null,
    },
    {
      id: 'rr_live_2',
      name: 'Craving SOS',
      description:
        'When urges hit, come here. Support from people who get it. Not a substitute for crisis services.',
      topic: 'cravings',
      memberCount: 0,
      maxMembers: 50,
      isJoined: false,
      isAnonymous: false,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      scheduledSessions: [],
      messages: [],
      rules: [
        'This is a crisis-aware space — be gentle',
        'No graphic descriptions of substance use',
        'Support; do not diagnose',
        'If you are in immediate danger, contact local emergency services',
        'Anonymous participation is welcome',
      ],
      isLive: true,
      currentSessionId: null,
    },
    {
      id: 'rr_live_3',
      name: 'Quiet Minds',
      description: 'Mindfulness-focused room. Breathing and present-moment awareness together.',
      topic: 'mindfulness',
      memberCount: 0,
      maxMembers: 50,
      isJoined: false,
      isAnonymous: false,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      scheduledSessions: [],
      messages: [],
      rules: [
        'Silence is welcome — you do not need to speak',
        'Be patient with yourself and others',
      ],
      isLive: true,
      currentSessionId: null,
    },
  ];
}

function initRooms() {
  for (const r of roomTemplates()) {
    roomMembers.set(r.id, new Set());
    roomMessages.set(r.id, []);
  }
}

initRooms();

function json(res, code, body, origin) {
  const o = origin || '*';
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      if (!data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function authUser(req) {
  const h = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  if (!m) return null;
  const tok = m[1].trim();
  const s = sessions.get(tok);
  if (!s) return null;
  return users.get(s.userId) || null;
}

function authToken(req) {
  const h = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

function buildRoomView(roomId, userId) {
  const tpl = roomTemplates().find((r) => r.id === roomId);
  if (!tpl) return null;
  const members = roomMembers.get(roomId);
  const msgs = roomMessages.get(roomId) || [];
  const count = members ? members.size : 0;
  return {
    ...tpl,
    memberCount: count,
    isJoined: userId ? members.has(userId) : false,
    messages: msgs.map((m) => ({
      ...m,
      isOwn: Boolean(userId && m.authorId === userId),
    })),
    lastActivity: msgs.length ? msgs[msgs.length - 1].timestamp : tpl.lastActivity,
  };
}

function listRoomsForUser(userId) {
  return roomTemplates()
    .map((t) => buildRoomView(t.id, userId))
    .filter(Boolean);
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '*';
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    });
    return res.end();
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  try {
    /** --- Auth --- */
    if (path === '/v1/auth/session' && req.method === 'POST') {
      const body = await readBody(req);
      const deviceId = String(body?.deviceId || randomUUID());
      let user = [...users.values()].find((u) => u.deviceId === deviceId);
      if (!user) {
        const id = `u_${randomUUID().slice(0, 8)}`;
        user = {
          id,
          username: `member_${id.slice(-6)}`,
          displayName: '',
          avatar: AVATAR,
          bio: '',
          joinedAt: new Date().toISOString(),
          followerIds: [],
          followingIds: [],
          deviceId,
        };
        users.set(id, user);
      }
      const token = randomUUID() + randomUUID();
      sessions.set(token, { userId: user.id });
      return json(res, 200, { token, user }, origin);
    }

    const user = authUser(req);
    const token = authToken(req);
    if (!user && path !== '/v1/auth/session') {
      return json(res, 401, { error: 'Unauthorized' }, origin);
    }

    if (path === '/v1/me' && req.method === 'GET') {
      return json(res, 200, { user }, origin);
    }

    if (path === '/v1/me' && req.method === 'PATCH') {
      const body = await readBody(req);
      if (body?.displayName != null) user.displayName = String(body.displayName).trim();
      if (body?.username != null) user.username = String(body.username).toLowerCase().trim();
      if (body?.bio != null) user.bio = String(body.bio);
      users.set(user.id, user);
      return json(res, 200, { user }, origin);
    }

    if (path === '/v1/me/blocks' && req.method === 'GET') {
      const b = getRoomBlocks(user.id);
      return json(
        res,
        200,
        { blockedAuthorNames: [...b.names], blockedUserIds: [...b.ids] },
        origin,
      );
    }

    if (path === '/v1/me/blocks' && req.method === 'POST') {
      const body = await readBody(req);
      const name = String(body?.authorName || '').trim();
      const sid = String(body?.authorId || '').trim();
      if (!name && !sid) return json(res, 400, { error: 'authorName or authorId required' }, origin);
      const b = getRoomBlocks(user.id);
      if (name) b.names.add(name);
      if (sid) b.ids.add(sid);
      return json(res, 200, { blockedAuthorNames: [...b.names], blockedUserIds: [...b.ids] }, origin);
    }

    if (path === '/v1/rooms' && req.method === 'GET') {
      return json(res, 200, { rooms: listRoomsForUser(user.id) }, origin);
    }

    const joinMatch = /^\/v1\/rooms\/([^/]+)\/join$/.exec(path);
    if (joinMatch && req.method === 'POST') {
      const roomId = joinMatch[1];
      const members = roomMembers.get(roomId);
      if (!members) return json(res, 404, { error: 'Room not found' }, origin);
      const room = buildRoomView(roomId, user.id);
      if (room.memberCount >= room.maxMembers) {
        return json(res, 403, { error: 'Room full' }, origin);
      }
      members.add(user.id);
      return json(res, 200, { rooms: listRoomsForUser(user.id) }, origin);
    }

    const leaveMatch = /^\/v1\/rooms\/([^/]+)\/leave$/.exec(path);
    if (leaveMatch && req.method === 'POST') {
      const roomId = leaveMatch[1];
      const members = roomMembers.get(roomId);
      if (members) members.delete(user.id);
      return json(res, 200, { rooms: listRoomsForUser(user.id) }, origin);
    }

    const msgMatch = /^\/v1\/rooms\/([^/]+)\/messages$/.exec(path);
    if (msgMatch && req.method === 'POST') {
      const roomId = msgMatch[1];
      const body = await readBody(req);
      const content = String(body?.content || '').trim();
      if (!content) return json(res, 400, { error: 'content required' }, origin);
      const anonymous = Boolean(body?.anonymous);
      const members = roomMembers.get(roomId);
      if (!members || !members.has(user.id)) {
        return json(res, 403, { error: 'Join the room before posting' }, origin);
      }
      const authorName = anonymous ? 'Anonymous' : user.displayName || user.username || 'Member';
      const msg = {
        id: `m_${randomUUID().slice(0, 12)}`,
        roomId,
        authorName,
        authorId: user.id,
        content,
        timestamp: new Date().toISOString(),
        isAnonymous: anonymous,
        isReported: false,
        reportReason: '',
      };
      const list = roomMessages.get(roomId) || [];
      list.push(msg);
      roomMessages.set(roomId, list);
      return json(res, 200, { rooms: listRoomsForUser(user.id) }, origin);
    }

    if (path === '/v1/rooms/reports' && req.method === 'POST') {
      const body = await readBody(req);
      const rep = {
        id: `rep_${randomUUID().slice(0, 10)}`,
        roomId: String(body?.roomId || ''),
        messageId: String(body?.messageId || ''),
        reporterId: user.id,
        reason: body?.reason || 'other',
        description: String(body?.description || ''),
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      moderationReports.push({ type: 'room_message', ...rep });
      return json(res, 201, { ok: true }, origin);
    }

    if (path === '/v1/rooms/user-reports' && req.method === 'POST') {
      const body = await readBody(req);
      const rep = {
        id: `rep_u_${randomUUID().slice(0, 10)}`,
        roomId: String(body?.roomId || ''),
        subjectUserId: String(body?.subjectUserId || ''),
        subjectDisplayName: String(body?.subjectDisplayName || ''),
        reporterId: user.id,
        reason: body?.reason || 'other',
        description: String(body?.description || ''),
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      moderationReports.push({ type: 'room_user', ...rep });
      return json(res, 201, { ok: true }, origin);
    }

    /** --- Community --- */
    if (path === '/v1/community/register' && req.method === 'POST') {
      const body = await readBody(req);
      user.username = String(body?.username || user.username).toLowerCase().trim();
      user.displayName = String(body?.displayName || '').trim();
      users.set(user.id, user);
      return json(res, 200, { me: user, users: [...users.values()] }, origin);
    }

    if (path === '/v1/community/users' && req.method === 'GET') {
      return json(res, 200, { users: [...users.values()] }, origin);
    }

    if (path === '/v1/community/posts' && req.method === 'GET') {
      return json(res, 200, { posts: [...communityPosts] }, origin);
    }

    if (path === '/v1/community/comments' && req.method === 'GET') {
      return json(res, 200, { comments: [...communityComments] }, origin);
    }

    if (path === '/v1/community/groups' && req.method === 'GET') {
      return json(res, 200, { groups: [...communityGroups] }, origin);
    }

    if (path === '/v1/community/posts' && req.method === 'POST') {
      const body = await readBody(req);
      const content = String(body?.content || '').trim();
      const visibility = body?.visibility === 'private' ? 'private' : 'public';
      if (!content) return json(res, 400, { error: 'content required' }, origin);
      const post = {
        id: `p_${randomUUID().slice(0, 10)}`,
        authorId: user.id,
        content,
        createdAt: new Date().toISOString(),
        visibility,
        likes: [],
        commentIds: [],
      };
      communityPosts.unshift(post);
      return json(res, 200, { posts: [...communityPosts], comments: [...communityComments] }, origin);
    }

    if (path === '/v1/community/comments' && req.method === 'POST') {
      const body = await readBody(req);
      const postId = String(body?.postId || '');
      const content = String(body?.content || '').trim();
      if (!postId || !content) return json(res, 400, { error: 'postId and content required' }, origin);
      const c = {
        id: `c_${randomUUID().slice(0, 10)}`,
        postId,
        authorId: user.id,
        content,
        createdAt: new Date().toISOString(),
      };
      communityComments.push(c);
      const p = communityPosts.find((x) => x.id === postId);
      if (p) p.commentIds = [...(p.commentIds || []), c.id];
      return json(res, 200, { posts: [...communityPosts], comments: [...communityComments] }, origin);
    }

    const likeMatch = /^\/v1\/community\/posts\/([^/]+)\/like$/.exec(path);
    if (likeMatch && req.method === 'POST') {
      const postId = likeMatch[1];
      const p = communityPosts.find((x) => x.id === postId);
      if (!p) return json(res, 404, { error: 'Post not found' }, origin);
      const has = (p.likes || []).includes(user.id);
      p.likes = has ? (p.likes || []).filter((id) => id !== user.id) : [...(p.likes || []), user.id];
      return json(res, 200, { posts: [...communityPosts] }, origin);
    }

    const followMatch = /^\/v1\/community\/users\/([^/]+)\/follow$/.exec(path);
    if (followMatch && req.method === 'POST') {
      const targetId = followMatch[1];
      const target = users.get(targetId);
      if (!target) return json(res, 404, { error: 'User not found' }, origin);
      const following = user.followingIds || [];
      const isF = following.includes(targetId);
      if (isF) {
        user.followingIds = following.filter((id) => id !== targetId);
        target.followerIds = (target.followerIds || []).filter((id) => id !== user.id);
      } else {
        user.followingIds = [...following, targetId];
        target.followerIds = [...(target.followerIds || []), user.id];
      }
      users.set(user.id, user);
      users.set(target.id, target);
      return json(res, 200, { me: user, users: [...users.values()] }, origin);
    }

    if (path === '/v1/admin/reports' && req.method === 'GET') {
      const secret = url.searchParams.get('secret') || '';
      if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
        return json(res, 403, { error: 'Forbidden' }, origin);
      }
      return json(res, 200, { reports: moderationReports }, origin);
    }

    return json(res, 404, { error: 'Not found' }, origin);
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: 'Server error' }, origin);
  }
});

server.listen(PORT, () => {
  console.log(`Live social reference server http://localhost:${PORT}`);
  console.log('Set EXPO_PUBLIC_LIVE_SOCIAL_API_URL in the Expo app to this origin (use LAN IP for devices).');
  if (ADMIN_SECRET) console.log('Admin reports: GET /v1/admin/reports?secret=***');
});

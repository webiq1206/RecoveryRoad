import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CommunityUser, CommunityPost, CommunityComment, PrivateGroup } from '@/types';

const STORAGE_KEYS = {
  COMMUNITY_USER: 'community_user',
  COMMUNITY_POSTS: 'community_posts',
  COMMUNITY_COMMENTS: 'community_comments',
  COMMUNITY_USERS: 'community_users',
  COMMUNITY_GROUPS: 'community_groups',
};

const AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
];

const SAMPLE_USERS: CommunityUser[] = [
  { id: 'user_sam', username: 'sam_recovery', displayName: 'Sam R.', avatar: AVATARS[0], bio: '90 days strong', joinedAt: '2025-11-01T00:00:00.000Z', followerIds: [], followingIds: [] },
  { id: 'user_alex', username: 'alex_hope', displayName: 'Alex H.', avatar: AVATARS[1], bio: 'One day at a time', joinedAt: '2025-10-15T00:00:00.000Z', followerIds: [], followingIds: [] },
  { id: 'user_jamie', username: 'jamie_strong', displayName: 'Jamie S.', avatar: AVATARS[2], bio: 'Finding my path', joinedAt: '2025-12-01T00:00:00.000Z', followerIds: [], followingIds: [] },
  { id: 'user_morgan', username: 'morgan_free', displayName: 'Morgan F.', avatar: AVATARS[3], bio: '1 year sober!', joinedAt: '2025-09-20T00:00:00.000Z', followerIds: [], followingIds: [] },
  { id: 'user_casey', username: 'casey_brave', displayName: 'Casey B.', avatar: AVATARS[4], bio: 'Grateful every day', joinedAt: '2025-08-10T00:00:00.000Z', followerIds: [], followingIds: [] },
];

const SAMPLE_POSTS: CommunityPost[] = [
  { id: 'post_1', authorId: 'user_sam', content: 'Just hit 90 days today! Never thought I would make it this far. To everyone just starting out - it gets easier, I promise.', createdAt: '2026-02-14T08:30:00.000Z', visibility: 'public', likes: ['user_alex', 'user_jamie'], commentIds: ['comment_1'] },
  { id: 'post_2', authorId: 'user_alex', content: 'Morning meditation really changed my recovery game. 15 minutes every morning before I do anything else. Highly recommend it.', createdAt: '2026-02-13T14:20:00.000Z', visibility: 'public', likes: ['user_sam'], commentIds: ['comment_2'] },
  { id: 'post_3', authorId: 'user_morgan', content: 'ONE YEAR SOBER! 365 days. I cannot believe it. Thank you to this community for all the support. You all saved my life.', createdAt: '2026-02-12T19:45:00.000Z', visibility: 'public', likes: ['user_sam', 'user_alex', 'user_jamie', 'user_casey'], commentIds: ['comment_3', 'comment_4'] },
  { id: 'post_4', authorId: 'user_casey', content: 'Had a tough day today but I did NOT give in. Called my sponsor, went for a walk, and journaled. The urge passed. We are stronger than our cravings.', createdAt: '2026-02-11T21:10:00.000Z', visibility: 'public', likes: ['user_morgan', 'user_jamie'], commentIds: [] },
  { id: 'post_5', authorId: 'user_jamie', content: 'Started volunteering at a local shelter. Giving back helps me stay grounded and reminds me how far I have come.', createdAt: '2026-02-10T10:00:00.000Z', visibility: 'public', likes: ['user_casey'], commentIds: ['comment_5'] },
];

const SAMPLE_COMMENTS: CommunityComment[] = [
  { id: 'comment_1', postId: 'post_1', authorId: 'user_alex', content: 'Congrats Sam! You are an inspiration!', createdAt: '2026-02-14T09:00:00.000Z' },
  { id: 'comment_2', postId: 'post_2', authorId: 'user_morgan', content: 'Meditation is a game changer. Keep it up!', createdAt: '2026-02-13T15:00:00.000Z' },
  { id: 'comment_3', postId: 'post_3', authorId: 'user_sam', content: 'Incredible milestone Morgan! So proud of you!', createdAt: '2026-02-12T20:00:00.000Z' },
  { id: 'comment_4', postId: 'post_3', authorId: 'user_casey', content: 'You deserve every bit of this! Happy anniversary!', createdAt: '2026-02-12T20:30:00.000Z' },
  { id: 'comment_5', postId: 'post_5', authorId: 'user_alex', content: 'That is beautiful Jamie. Service work is so important.', createdAt: '2026-02-10T11:00:00.000Z' },
];

export const [CommunityProvider, useCommunity] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [allUsers, setAllUsers] = useState<CommunityUser[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [groups, setGroups] = useState<PrivateGroup[]>([]);

  const userQuery = useQuery({
    queryKey: ['communityUser'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.COMMUNITY_USER);
      return stored ? (JSON.parse(stored) as CommunityUser) : null;
    },
    staleTime: Infinity,
  });

  const usersQuery = useQuery({
    queryKey: ['communityUsers'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.COMMUNITY_USERS);
      return stored ? (JSON.parse(stored) as CommunityUser[]) : SAMPLE_USERS;
    },
    staleTime: Infinity,
  });

  const postsQuery = useQuery({
    queryKey: ['communityPosts'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.COMMUNITY_POSTS);
      return stored ? (JSON.parse(stored) as CommunityPost[]) : SAMPLE_POSTS;
    },
    staleTime: Infinity,
  });

  const commentsQuery = useQuery({
    queryKey: ['communityComments'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.COMMUNITY_COMMENTS);
      return stored ? (JSON.parse(stored) as CommunityComment[]) : SAMPLE_COMMENTS;
    },
    staleTime: Infinity,
  });

  const groupsQuery = useQuery({
    queryKey: ['communityGroups'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.COMMUNITY_GROUPS);
      return stored ? (JSON.parse(stored) as PrivateGroup[]) : [];
    },
    staleTime: Infinity,
  });

  useEffect(() => { if (userQuery.data !== undefined) setCurrentUser(userQuery.data); }, [userQuery.data]);
  useEffect(() => { if (usersQuery.data) setAllUsers(usersQuery.data); }, [usersQuery.data]);
  useEffect(() => { if (postsQuery.data) setPosts(postsQuery.data); }, [postsQuery.data]);
  useEffect(() => { if (commentsQuery.data) setComments(commentsQuery.data); }, [commentsQuery.data]);
  useEffect(() => { if (groupsQuery.data) setGroups(groupsQuery.data); }, [groupsQuery.data]);

  const saveUserMutation = useMutation({
    mutationFn: async (user: CommunityUser) => {
      await AsyncStorage.setItem(STORAGE_KEYS.COMMUNITY_USER, JSON.stringify(user));
      return user;
    },
    onSuccess: (data) => {
      setCurrentUser(data);
      queryClient.setQueryData(['communityUser'], data);
    },
  });

  const saveUsersMutation = useMutation({
    mutationFn: async (users: CommunityUser[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.COMMUNITY_USERS, JSON.stringify(users));
      return users;
    },
    onSuccess: (data) => {
      setAllUsers(data);
      queryClient.setQueryData(['communityUsers'], data);
    },
  });

  const savePostsMutation = useMutation({
    mutationFn: async (newPosts: CommunityPost[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(newPosts));
      return newPosts;
    },
    onSuccess: (data) => {
      setPosts(data);
      queryClient.setQueryData(['communityPosts'], data);
    },
  });

  const saveCommentsMutation = useMutation({
    mutationFn: async (newComments: CommunityComment[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.COMMUNITY_COMMENTS, JSON.stringify(newComments));
      return newComments;
    },
    onSuccess: (data) => {
      setComments(data);
      queryClient.setQueryData(['communityComments'], data);
    },
  });

  const saveGroupsMutation = useMutation({
    mutationFn: async (newGroups: PrivateGroup[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.COMMUNITY_GROUPS, JSON.stringify(newGroups));
      return newGroups;
    },
    onSuccess: (data) => {
      setGroups(data);
      queryClient.setQueryData(['communityGroups'], data);
    },
  });

  const setupUser = useCallback((username: string, displayName: string) => {
    const user: CommunityUser = {
      id: 'user_' + Date.now().toString(),
      username: username.toLowerCase().trim(),
      displayName: displayName.trim(),
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      bio: '',
      joinedAt: new Date().toISOString(),
      followerIds: [],
      followingIds: [],
    };
    saveUserMutation.mutate(user);
    const updatedUsers = [...allUsers, user];
    saveUsersMutation.mutate(updatedUsers);
    return user;
  }, [allUsers]);

  const createPost = useCallback((content: string, visibility: 'public' | 'private') => {
    if (!currentUser) return;
    const post: CommunityPost = {
      id: 'post_' + Date.now().toString(),
      authorId: currentUser.id,
      content,
      createdAt: new Date().toISOString(),
      visibility,
      likes: [],
      commentIds: [],
    };
    const updated = [post, ...posts];
    setPosts(updated);
    savePostsMutation.mutate(updated);
  }, [currentUser, posts]);

  const addComment = useCallback((postId: string, content: string) => {
    if (!currentUser) return;
    const comment: CommunityComment = {
      id: 'comment_' + Date.now().toString(),
      postId,
      authorId: currentUser.id,
      content,
      createdAt: new Date().toISOString(),
    };
    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    saveCommentsMutation.mutate(updatedComments);

    const updatedPosts = posts.map(p =>
      p.id === postId ? { ...p, commentIds: [...p.commentIds, comment.id] } : p
    );
    setPosts(updatedPosts);
    savePostsMutation.mutate(updatedPosts);
  }, [currentUser, comments, posts]);

  const toggleLike = useCallback((postId: string) => {
    if (!currentUser) return;
    const updatedPosts = posts.map(p => {
      if (p.id !== postId) return p;
      const hasLiked = p.likes.includes(currentUser.id);
      return {
        ...p,
        likes: hasLiked
          ? p.likes.filter(id => id !== currentUser.id)
          : [...p.likes, currentUser.id],
      };
    });
    setPosts(updatedPosts);
    savePostsMutation.mutate(updatedPosts);
  }, [currentUser, posts]);

  const toggleFollow = useCallback((targetUserId: string) => {
    if (!currentUser) return;
    const isFollowing = currentUser.followingIds.includes(targetUserId);
    const updatedUser = {
      ...currentUser,
      followingIds: isFollowing
        ? currentUser.followingIds.filter(id => id !== targetUserId)
        : [...currentUser.followingIds, targetUserId],
    };
    setCurrentUser(updatedUser);
    saveUserMutation.mutate(updatedUser);

    const updatedUsers = allUsers.map(u => {
      if (u.id === targetUserId) {
        return {
          ...u,
          followerIds: isFollowing
            ? u.followerIds.filter(id => id !== currentUser.id)
            : [...u.followerIds, currentUser.id],
        };
      }
      return u;
    });
    setAllUsers(updatedUsers);
    saveUsersMutation.mutate(updatedUsers);
  }, [currentUser, allUsers]);

  const createGroup = useCallback((name: string, memberUsernames: string[]) => {
    if (!currentUser) return;
    const group: PrivateGroup = {
      id: 'group_' + Date.now().toString(),
      ownerId: currentUser.id,
      name,
      memberUsernames,
      createdAt: new Date().toISOString(),
    };
    const updated = [...groups, group];
    setGroups(updated);
    saveGroupsMutation.mutate(updated);
  }, [currentUser, groups]);

  const addMemberToGroup = useCallback((groupId: string, username: string) => {
    const updated = groups.map(g => {
      if (g.id !== groupId) return g;
      if (g.memberUsernames.includes(username)) return g;
      return { ...g, memberUsernames: [...g.memberUsernames, username] };
    });
    setGroups(updated);
    saveGroupsMutation.mutate(updated);
  }, [groups]);

  const removeMemberFromGroup = useCallback((groupId: string, username: string) => {
    const updated = groups.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, memberUsernames: g.memberUsernames.filter(u => u !== username) };
    });
    setGroups(updated);
    saveGroupsMutation.mutate(updated);
  }, [groups]);

  const deleteGroup = useCallback((groupId: string) => {
    const updated = groups.filter(g => g.id !== groupId);
    setGroups(updated);
    saveGroupsMutation.mutate(updated);
  }, [groups]);

  const getUserById = useCallback((userId: string): CommunityUser | undefined => {
    if (currentUser?.id === userId) return currentUser;
    return allUsers.find(u => u.id === userId);
  }, [currentUser, allUsers]);

  const getCommentsForPost = useCallback((postId: string): CommunityComment[] => {
    return comments.filter(c => c.postId === postId).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [comments]);

  const visiblePosts = useMemo(() => {
    if (!currentUser) return posts.filter(p => p.visibility === 'public');

    const myGroupMemberUsernames = groups
      .filter(g => g.ownerId === currentUser.id)
      .flatMap(g => g.memberUsernames);

    const groupsImIn = groups.filter(g =>
      g.memberUsernames.includes(currentUser.username)
    );
    const ownerIds = groupsImIn.map(g => g.ownerId);

    return posts.filter(p => {
      if (p.visibility === 'public') return true;
      if (p.authorId === currentUser.id) return true;
      const author = allUsers.find(u => u.id === p.authorId);
      if (author && myGroupMemberUsernames.includes(author.username)) return true;
      if (ownerIds.includes(p.authorId)) return true;
      return false;
    });
  }, [posts, currentUser, groups, allUsers]);

  const isLoading = userQuery.isLoading || postsQuery.isLoading || commentsQuery.isLoading || groupsQuery.isLoading;

  return useMemo(() => ({
    currentUser,
    allUsers,
    posts: visiblePosts,
    comments,
    groups,
    isLoading,
    setupUser,
    createPost,
    addComment,
    toggleLike,
    toggleFollow,
    createGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    deleteGroup,
    getUserById,
    getCommentsForPost,
  }), [
    currentUser, allUsers, visiblePosts, comments, groups,
    isLoading, setupUser, createPost, addComment, toggleLike,
    toggleFollow, createGroup, addMemberToGroup, removeMemberFromGroup,
    deleteGroup, getUserById, getCommentsForPost,
  ]);
});

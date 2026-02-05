"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { BrowserOAuthClient } from "@atproto/oauth-client-browser"
import { Agent, RichText } from "@atproto/api"

interface BlueskyUser {
  did: string
  handle: string
  displayName?: string
  avatar?: string
  banner?: string
  description?: string
  followersCount?: number
  followsCount?: number
  postsCount?: number
}

interface BlueskyPost {
  uri: string
  cid: string
  author: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  record: {
    text: string
    createdAt: string
    facets?: unknown[]
    reply?: {
      root: { uri: string; cid: string }
      parent: { uri: string; cid: string }
    }
    embed?: unknown
  }
  embed?: {
    $type: string
    record?: {
      uri: string
      cid: string
      author: {
        did: string
        handle: string
        displayName?: string
        avatar?: string
      }
      value: {
        text: string
        createdAt: string
      }
    }
    images?: Array<{
      thumb: string
      fullsize: string
      alt: string
    }>
  }
  replyCount: number
  repostCount: number
  likeCount: number
  indexedAt: string
  viewer?: {
    like?: string
    repost?: string
  }
  reason?: {
    $type: string
    by?: {
      did: string
      handle: string
      displayName?: string
      avatar?: string
    }
  }
}

interface BlueskyNotification {
  uri: string
  cid: string
  author: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  reason: 'like' | 'repost' | 'follow' | 'mention' | 'reply' | 'quote'
  reasonSubject?: string
  record: unknown
  isRead: boolean
  indexedAt: string
}

interface BlueskyList {
  uri: string
  cid: string
  name: string
  purpose: 'app.bsky.graph.defs#modlist' | 'app.bsky.graph.defs#curatelist'
  description?: string
  avatar?: string
  creator: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  indexedAt: string
  viewer?: {
    muted?: boolean
    blocked?: string
  }
}

interface BlueskyConvo {
  id: string
  rev: string
  members: Array<{
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }>
  lastMessage?: {
    id: string
    text: string
    sender: { did: string }
    sentAt: string
  }
  unreadCount: number
  muted: boolean
}

interface BlueskyMessage {
  id: string
  rev: string
  text: string
  sender: { did: string }
  sentAt: string
}

interface BlueskyStarterPack {
  uri: string
  cid: string
  record: {
    name: string
    description?: string
    list: string
    feeds?: Array<{ uri: string }>
    createdAt: string
  }
  creator: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  list?: {
    uri: string
    cid: string
    name: string
    listItemCount?: number
  }
  listItemsSample?: Array<{
    uri: string
    subject: {
      did: string
      handle: string
      displayName?: string
      avatar?: string
      description?: string
    }
  }>
  feeds?: Array<{
    uri: string
    cid: string
    did: string
    displayName: string
    description?: string
    avatar?: string
    likeCount?: number
  }>
  joinedWeekCount?: number
  joinedAllTimeCount?: number
  indexedAt: string
}

interface BlueskyFeedGenerator {
  uri: string
  cid: string
  did: string
  creator: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  displayName: string
  description?: string
  avatar?: string
  likeCount?: number
  indexedAt: string
  viewer?: {
    like?: string
  }
}

interface BlueskyContextType {
  agent: Agent | null
  user: BlueskyUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (handle?: string) => Promise<void>
  logout: () => Promise<void>
  // Posts
  createPost: (text: string, options?: { reply?: { uri: string; cid: string }; embed?: unknown; images?: File[] }) => Promise<{ uri: string; cid: string }>
  deletePost: (uri: string) => Promise<void>
  editPost: (uri: string, newText: string) => Promise<{ uri: string; cid: string }>
  getPostThread: (uri: string) => Promise<{ post: BlueskyPost; replies: BlueskyPost[] }>
  quotePost: (text: string, quotedPost: { uri: string; cid: string }) => Promise<{ uri: string; cid: string }>
  // Timelines & Feeds
  getTimeline: (cursor?: string) => Promise<{ posts: BlueskyPost[]; cursor?: string }>
  getPublicFeed: () => Promise<BlueskyPost[]>
  getUserPosts: (actor?: string) => Promise<BlueskyPost[]>
  getUserReplies: (actor?: string) => Promise<BlueskyPost[]>
  getUserMedia: (actor?: string) => Promise<BlueskyPost[]>
  getUserLikes: (actor?: string) => Promise<BlueskyPost[]>
  getCustomFeed: (feedUri: string, cursor?: string) => Promise<{ posts: BlueskyPost[]; cursor?: string }>
  getSavedFeeds: () => Promise<BlueskyFeedGenerator[]>
  getPopularFeeds: (cursor?: string) => Promise<{ feeds: BlueskyFeedGenerator[]; cursor?: string }>
  searchFeedGenerators: (query: string, cursor?: string) => Promise<{ feeds: BlueskyFeedGenerator[]; cursor?: string }>
  saveFeed: (uri: string) => Promise<void>
  unsaveFeed: (uri: string) => Promise<void>
  // Interactions
  likePost: (uri: string, cid: string) => Promise<void>
  unlikePost: (likeUri: string) => Promise<void>
  repost: (uri: string, cid: string) => Promise<void>
  unrepost: (repostUri: string) => Promise<void>
  reportPost: (uri: string, cid: string, reason: string) => Promise<void>
  // Profile
  getProfile: (actor: string) => Promise<BlueskyUser>
  updateProfile: (profile: { displayName?: string; description?: string; avatar?: Blob; banner?: Blob }) => Promise<void>
  followUser: (did: string) => Promise<string>
  unfollowUser: (followUri: string) => Promise<void>
  blockUser: (did: string) => Promise<string>
  unblockUser: (blockUri: string) => Promise<void>
  muteUser: (did: string) => Promise<void>
  unmuteUser: (did: string) => Promise<void>
  getFollowers: (actor: string, cursor?: string) => Promise<{ followers: BlueskyUser[]; cursor?: string }>
  getFollowing: (actor: string, cursor?: string) => Promise<{ following: BlueskyUser[]; cursor?: string }>
  // Notifications
  getNotifications: (cursor?: string) => Promise<{ notifications: BlueskyNotification[]; cursor?: string }>
  getUnreadCount: () => Promise<number>
  markNotificationsRead: () => Promise<void>
  // Lists
  getLists: (actor?: string) => Promise<BlueskyList[]>
  getList: (uri: string) => Promise<{ list: BlueskyList; items: Array<{ uri: string; subject: BlueskyUser }> }>
  createList: (name: string, purpose: 'modlist' | 'curatelist', description?: string) => Promise<{ uri: string; cid: string }>
  updateList: (uri: string, name: string, description?: string) => Promise<void>
  deleteList: (uri: string) => Promise<void>
  addToList: (listUri: string, did: string) => Promise<void>
  removeFromList: (uri: string) => Promise<void>
  // Chat/Messages
  getConversations: () => Promise<BlueskyConvo[]>
  getMessages: (convoId: string, cursor?: string) => Promise<{ messages: BlueskyMessage[]; cursor?: string }>
  sendMessage: (convoId: string, text: string) => Promise<BlueskyMessage>
  startConversation: (did: string) => Promise<BlueskyConvo>
  // Starter Packs
  getStarterPacks: (actor?: string) => Promise<BlueskyStarterPack[]>
  getStarterPack: (uri: string) => Promise<BlueskyStarterPack>
  createStarterPack: (name: string, description?: string, listItems?: string[], feedUris?: string[]) => Promise<{ uri: string; cid: string }>
  updateStarterPack: (uri: string, name: string, description?: string) => Promise<void>
  deleteStarterPack: (uri: string) => Promise<void>
  addToStarterPack: (starterPackUri: string, did: string) => Promise<void>
  removeFromStarterPack: (starterPackUri: string, did: string) => Promise<void>
  // Search
  searchPosts: (query: string, cursor?: string) => Promise<{ posts: BlueskyPost[]; cursor?: string }>
  searchActors: (query: string, cursor?: string) => Promise<{ actors: BlueskyUser[]; cursor?: string }>
  searchByHashtag: (hashtag: string, cursor?: string) => Promise<{ posts: BlueskyPost[]; cursor?: string }>
  // List Feeds
  getListFeed: (listUri: string, cursor?: string) => Promise<{ posts: BlueskyPost[]; cursor?: string }>
  // Utility
  uploadImage: (file: File) => Promise<{ blob: unknown }>
  resolveHandle: (handle: string) => Promise<string>
}

const BlueskyContext = createContext<BlueskyContextType | undefined>(undefined)

let oauthClient: BrowserOAuthClient | null = null

async function getOAuthClient(): Promise<BrowserOAuthClient> {
  if (oauthClient) return oauthClient
  
  oauthClient = new BrowserOAuthClient({
    handleResolver: "https://bsky.social",
    clientMetadata: {
      client_id: "https://www.sociallydead.me/oauth/client-metadata.json",
      client_name: "SociallyDead",
      client_uri: "https://www.sociallydead.me/",
      redirect_uris: [window.origin + "/oauth/callback"],
      scope: "atproto transition:generic transition:chat.bsky",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      application_type: "web",
      token_endpoint_auth_method: "none",
      dpop_bound_access_tokens: true,
    },
  })
  
  return oauthClient
}

export function BlueskyProvider({ children }: { children: React.ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [user, setUser] = useState<BlueskyUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [publicAgent] = useState(() => new Agent("https://api.bsky.app"))

  useEffect(() => {
    const init = async () => {
      try {
        const client = await getOAuthClient()
        const result = await client.init()
        
        if (result?.session) {
          const oauthAgent = new Agent(result.session)
          setAgent(oauthAgent)
          
          const profile = await oauthAgent.getProfile({ actor: result.session.did })
          setUser({
            did: result.session.did,
            handle: profile.data.handle,
            displayName: profile.data.displayName,
            avatar: profile.data.avatar,
            banner: profile.data.banner,
            description: profile.data.description,
            followersCount: profile.data.followersCount,
            followsCount: profile.data.followsCount,
            postsCount: profile.data.postsCount,
          })
        }
      } catch (error) {
        console.error("OAuth init error:", error)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const login = async (handle?: string) => {
    try {
      const client = await getOAuthClient()
      const userHandle = handle || window.prompt("Enter your Bluesky handle (e.g., user.bsky.social):")
      if (!userHandle) return
      
      await client.signIn(userHandle, {
        signal: new AbortController().signal,
      })
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = useCallback(async () => {
    try {
      if (oauthClient && user) {
        const sessions = await oauthClient.getSession(user.did)
        if (sessions) {
          await oauthClient.revoke(user.did)
        }
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      setAgent(null)
      oauthClient = null
      window.location.href = "/"
    }
  }, [user])

  // Posts
  const createPost = async (text: string, options?: { reply?: { uri: string; cid: string }; embed?: unknown; images?: File[] }) => {
    if (!agent) throw new Error("Not authenticated")
    
    const rt = new RichText({ text })
    await rt.detectFacets(agent)
    
    let embed = options?.embed

    // Handle images
    if (options?.images && options.images.length > 0) {
      const imageBlobs = await Promise.all(
        options.images.map(async (file) => {
          const response = await agent.uploadBlob(file, { encoding: file.type })
          return {
            alt: '',
            image: response.data.blob,
          }
        })
      )
      embed = {
        $type: 'app.bsky.embed.images',
        images: imageBlobs,
      }
    }

    const postRecord: Record<string, unknown> = {
      text: rt.text,
      facets: rt.facets,
      createdAt: new Date().toISOString(),
    }

    if (options?.reply) {
      // Get the thread to find the root
      const thread = await agent.getPostThread({ uri: options.reply.uri })
      const threadPost = thread.data.thread
      
      let rootUri = options.reply.uri
      let rootCid = options.reply.cid
      
      if ('post' in threadPost && threadPost.post) {
        const record = threadPost.post.record as { reply?: { root: { uri: string; cid: string } } }
        if (record.reply?.root) {
          rootUri = record.reply.root.uri
          rootCid = record.reply.root.cid
        }
      }

      postRecord.reply = {
        root: { uri: rootUri, cid: rootCid },
        parent: { uri: options.reply.uri, cid: options.reply.cid },
      }
    }

    if (embed) {
      postRecord.embed = embed
    }
    
    const response = await agent.post(postRecord as Parameters<typeof agent.post>[0])
    
    return { uri: response.uri, cid: response.cid }
  }

  const deletePost = async (uri: string) => {
    if (!agent) throw new Error("Not authenticated")
    await agent.deletePost(uri)
  }

  const editPost = async (uri: string, newText: string) => {
    if (!agent) throw new Error("Not authenticated")
    await deletePost(uri)
    return await createPost(newText)
  }

  const getPostThread = async (uri: string): Promise<{ post: BlueskyPost; replies: BlueskyPost[] }> => {
    const agentToUse = agent || publicAgent
    const response = await agentToUse.getPostThread({ uri, depth: 10 })
    
    const thread = response.data.thread
    if (!('post' in thread)) throw new Error("Post not found")
    
    const post = thread.post
    const replies: BlueskyPost[] = []
    
    if ('replies' in thread && Array.isArray(thread.replies)) {
      for (const reply of thread.replies) {
        if ('post' in reply) {
          replies.push({
            uri: reply.post.uri,
            cid: reply.post.cid,
            author: {
              did: reply.post.author.did,
              handle: reply.post.author.handle,
              displayName: reply.post.author.displayName,
              avatar: reply.post.author.avatar,
            },
            record: reply.post.record as BlueskyPost["record"],
            replyCount: reply.post.replyCount ?? 0,
            repostCount: reply.post.repostCount ?? 0,
            likeCount: reply.post.likeCount ?? 0,
            indexedAt: reply.post.indexedAt,
            viewer: reply.post.viewer,
          })
        }
      }
    }
    
    return {
      post: {
        uri: post.uri,
        cid: post.cid,
        author: {
          did: post.author.did,
          handle: post.author.handle,
          displayName: post.author.displayName,
          avatar: post.author.avatar,
        },
        record: post.record as BlueskyPost["record"],
        embed: post.embed as BlueskyPost["embed"],
        replyCount: post.replyCount ?? 0,
        repostCount: post.repostCount ?? 0,
        likeCount: post.likeCount ?? 0,
        indexedAt: post.indexedAt,
        viewer: post.viewer,
      },
      replies,
    }
  }

  const quotePost = async (text: string, quotedPost: { uri: string; cid: string }) => {
    if (!agent) throw new Error("Not authenticated")
    
    const rt = new RichText({ text })
    await rt.detectFacets(agent)
    
    const response = await agent.post({
      text: rt.text,
      facets: rt.facets,
      embed: {
        $type: 'app.bsky.embed.record',
        record: {
          uri: quotedPost.uri,
          cid: quotedPost.cid,
        },
      },
      createdAt: new Date().toISOString(),
    })
    
    return { uri: response.uri, cid: response.cid }
  }

  // Timelines & Feeds
  const getTimeline = async (cursor?: string): Promise<{ posts: BlueskyPost[]; cursor?: string }> => {
    if (!agent) throw new Error("Not authenticated")
    
    const response = await agent.getTimeline({ limit: 50, cursor })
    return {
      posts: response.data.feed.map((item) => ({
        uri: item.post.uri,
        cid: item.post.cid,
        author: {
          did: item.post.author.did,
          handle: item.post.author.handle,
          displayName: item.post.author.displayName,
          avatar: item.post.author.avatar,
        },
        record: item.post.record as BlueskyPost["record"],
        embed: item.post.embed as BlueskyPost["embed"],
        replyCount: item.post.replyCount ?? 0,
        repostCount: item.post.repostCount ?? 0,
        likeCount: item.post.likeCount ?? 0,
        indexedAt: item.post.indexedAt,
        viewer: item.post.viewer,
        reason: item.reason as BlueskyPost["reason"],
      })),
      cursor: response.data.cursor,
    }
  }

  const getPublicFeed = async (): Promise<BlueskyPost[]> => {
    const response = await publicAgent.app.bsky.feed.getFeed({
      feed: "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot",
      limit: 50,
    })
    
    return response.data.feed.map((item) => ({
      uri: item.post.uri,
      cid: item.post.cid,
      author: {
        did: item.post.author.did,
        handle: item.post.author.handle,
        displayName: item.post.author.displayName,
        avatar: item.post.author.avatar,
      },
      record: item.post.record as BlueskyPost["record"],
      embed: item.post.embed as BlueskyPost["embed"],
      replyCount: item.post.replyCount ?? 0,
      repostCount: item.post.repostCount ?? 0,
      likeCount: item.post.likeCount ?? 0,
      indexedAt: item.post.indexedAt,
      viewer: item.post.viewer,
    }))
  }

  const getUserPosts = async (actor?: string): Promise<BlueskyPost[]> => {
    if (!agent || !user) throw new Error("Not authenticated")
    
    const response = await agent.getAuthorFeed({ 
      actor: actor || user.did, 
      limit: 50,
      filter: 'posts_no_replies',
    })
    return response.data.feed.map((item) => ({
      uri: item.post.uri,
      cid: item.post.cid,
      author: {
        did: item.post.author.did,
        handle: item.post.author.handle,
        displayName: item.post.author.displayName,
        avatar: item.post.author.avatar,
      },
      record: item.post.record as BlueskyPost["record"],
      embed: item.post.embed as BlueskyPost["embed"],
      replyCount: item.post.replyCount ?? 0,
      repostCount: item.post.repostCount ?? 0,
      likeCount: item.post.likeCount ?? 0,
      indexedAt: item.post.indexedAt,
      viewer: item.post.viewer,
      reason: item.reason as BlueskyPost["reason"],
    }))
  }

  const getUserReplies = async (actor?: string): Promise<BlueskyPost[]> => {
    if (!agent || !user) throw new Error("Not authenticated")
    
    const response = await agent.getAuthorFeed({ 
      actor: actor || user.did, 
      limit: 50,
      filter: 'posts_with_replies',
    })
    return response.data.feed.map((item) => ({
      uri: item.post.uri,
      cid: item.post.cid,
      author: {
        did: item.post.author.did,
        handle: item.post.author.handle,
        displayName: item.post.author.displayName,
        avatar: item.post.author.avatar,
      },
      record: item.post.record as BlueskyPost["record"],
      embed: item.post.embed as BlueskyPost["embed"],
      replyCount: item.post.replyCount ?? 0,
      repostCount: item.post.repostCount ?? 0,
      likeCount: item.post.likeCount ?? 0,
      indexedAt: item.post.indexedAt,
      viewer: item.post.viewer,
    }))
  }

  const getUserMedia = async (actor?: string): Promise<BlueskyPost[]> => {
    if (!agent || !user) throw new Error("Not authenticated")
    
    const response = await agent.getAuthorFeed({ 
      actor: actor || user.did, 
      limit: 50,
      filter: 'posts_with_media',
    })
    return response.data.feed.map((item) => ({
      uri: item.post.uri,
      cid: item.post.cid,
      author: {
        did: item.post.author.did,
        handle: item.post.author.handle,
        displayName: item.post.author.displayName,
        avatar: item.post.author.avatar,
      },
      record: item.post.record as BlueskyPost["record"],
      embed: item.post.embed as BlueskyPost["embed"],
      replyCount: item.post.replyCount ?? 0,
      repostCount: item.post.repostCount ?? 0,
      likeCount: item.post.likeCount ?? 0,
      indexedAt: item.post.indexedAt,
      viewer: item.post.viewer,
    }))
  }

  const getUserLikes = async (actor?: string): Promise<BlueskyPost[]> => {
    if (!agent || !user) throw new Error("Not authenticated")
    
    const response = await agent.getActorLikes({ 
      actor: actor || user.did, 
      limit: 50,
    })
    return response.data.feed.map((item) => ({
      uri: item.post.uri,
      cid: item.post.cid,
      author: {
        did: item.post.author.did,
        handle: item.post.author.handle,
        displayName: item.post.author.displayName,
        avatar: item.post.author.avatar,
      },
      record: item.post.record as BlueskyPost["record"],
      embed: item.post.embed as BlueskyPost["embed"],
      replyCount: item.post.replyCount ?? 0,
      repostCount: item.post.repostCount ?? 0,
      likeCount: item.post.likeCount ?? 0,
      indexedAt: item.post.indexedAt,
      viewer: item.post.viewer,
    }))
  }

  const getCustomFeed = async (feedUri: string, cursor?: string): Promise<{ posts: BlueskyPost[]; cursor?: string }> => {
    // Always try with publicAgent first for custom feeds to ensure they work without auth
    try {
      const response = await publicAgent.app.bsky.feed.getFeed({
        feed: feedUri,
        limit: 50,
        cursor,
      })
      
      return {
        posts: response.data.feed.map((item) => ({
          uri: item.post.uri,
          cid: item.post.cid,
          author: {
            did: item.post.author.did,
            handle: item.post.author.handle,
            displayName: item.post.author.displayName,
            avatar: item.post.author.avatar,
          },
          record: item.post.record as BlueskyPost["record"],
          embed: item.post.embed as BlueskyPost["embed"],
          replyCount: item.post.replyCount ?? 0,
          repostCount: item.post.repostCount ?? 0,
          likeCount: item.post.likeCount ?? 0,
          indexedAt: item.post.indexedAt,
          viewer: item.post.viewer,
        })),
        cursor: response.data.cursor,
      }
    } catch (publicError) {
      // If public API fails and we have an authenticated agent, try that
      if (agent) {
        const response = await agent.app.bsky.feed.getFeed({
          feed: feedUri,
          limit: 50,
          cursor,
        })
        
        return {
          posts: response.data.feed.map((item) => ({
            uri: item.post.uri,
            cid: item.post.cid,
            author: {
              did: item.post.author.did,
              handle: item.post.author.handle,
              displayName: item.post.author.displayName,
              avatar: item.post.author.avatar,
            },
            record: item.post.record as BlueskyPost["record"],
            embed: item.post.embed as BlueskyPost["embed"],
            replyCount: item.post.replyCount ?? 0,
            repostCount: item.post.repostCount ?? 0,
            likeCount: item.post.likeCount ?? 0,
            indexedAt: item.post.indexedAt,
            viewer: item.post.viewer,
          })),
          cursor: response.data.cursor,
        }
      }
      throw publicError
    }
  }

  const getSavedFeeds = async (): Promise<BlueskyFeedGenerator[]> => {
    if (!agent) throw new Error("Not authenticated")
    
    const prefs = await agent.app.bsky.actor.getPreferences()
    const savedFeedsPref = prefs.data.preferences.find(
      (pref) => pref.$type === 'app.bsky.actor.defs#savedFeedsPrefV2'
    ) as { items?: Array<{ type: string; value: string; pinned: boolean }> } | undefined
    
    if (!savedFeedsPref?.items) return []
    
    const feedUris = savedFeedsPref.items
      .filter((item) => item.type === 'feed')
      .map((item) => item.value)
    
    if (feedUris.length === 0) return []
    
    const response = await agent.app.bsky.feed.getFeedGenerators({ feeds: feedUris })
    
    return response.data.feeds.map((feed) => ({
      uri: feed.uri,
      cid: feed.cid,
      did: feed.did,
      creator: {
        did: feed.creator.did,
        handle: feed.creator.handle,
        displayName: feed.creator.displayName,
        avatar: feed.creator.avatar,
      },
      displayName: feed.displayName,
      description: feed.description,
      avatar: feed.avatar,
      likeCount: feed.likeCount,
      indexedAt: feed.indexedAt,
      viewer: feed.viewer,
    }))
  }

  const getPopularFeeds = async (cursor?: string): Promise<{ feeds: BlueskyFeedGenerator[]; cursor?: string }> => {
    const agentToUse = agent || publicAgent
    const response = await agentToUse.app.bsky.feed.getSuggestedFeeds({
      limit: 50,
      cursor,
    })
    
    return {
      feeds: response.data.feeds.map((feed) => ({
        uri: feed.uri,
        cid: feed.cid,
        did: feed.did,
        creator: {
          did: feed.creator.did,
          handle: feed.creator.handle,
          displayName: feed.creator.displayName,
          avatar: feed.creator.avatar,
        },
        displayName: feed.displayName,
        description: feed.description,
        avatar: feed.avatar,
        likeCount: feed.likeCount,
        indexedAt: feed.indexedAt,
        viewer: feed.viewer,
      })),
      cursor: response.data.cursor,
    }
  }

  const searchFeedGenerators = async (query: string, cursor?: string): Promise<{ feeds: BlueskyFeedGenerator[]; cursor?: string }> => {
    const agentToUse = agent || publicAgent
    const response = await agentToUse.app.bsky.unspecced.getPopularFeedGenerators({
      query,
      limit: 50,
      cursor,
    })
    
    return {
      feeds: response.data.feeds.map((feed) => ({
        uri: feed.uri,
        cid: feed.cid,
        did: feed.did,
        creator: {
          did: feed.creator.did,
          handle: feed.creator.handle,
          displayName: feed.creator.displayName,
          avatar: feed.creator.avatar,
        },
        displayName: feed.displayName,
        description: feed.description,
        avatar: feed.avatar,
        likeCount: feed.likeCount,
        indexedAt: feed.indexedAt,
        viewer: feed.viewer,
      })),
      cursor: response.data.cursor,
    }
  }

  const saveFeed = async (uri: string) => {
    if (!agent) throw new Error("Not authenticated")
    await agent.addSavedFeed({ type: 'feed', value: uri, pinned: false })
  }

  const unsaveFeed = async (uri: string) => {
    if (!agent) throw new Error("Not authenticated")
    await agent.removeSavedFeed(uri)
  }

  // Interactions
  const likePost = async (uri: string, cid: string) => {
    if (!agent) throw new Error("Not authenticated")
    await agent.like(uri, cid)
  }

  const unlikePost = async (likeUri: string) => {
    if (!agent) throw new Error("Not authenticated")
    await agent.deleteLike(likeUri)
  }

  const repost = async (uri: string, cid: string) => {
    if (!agent) throw new Error("Not authenticated")
    await agent.repost(uri, cid)
  }

  const unrepost = async (repostUri: string) => {
    if (!agent) throw new Error("Not authenticated")
    await agent.deleteRepost(repostUri)
  }

  const reportPost = async (uri: string, cid: string, reason: string) => {
    if (!agent) throw new Error("Not authenticated")
    await agent.com.atproto.moderation.createReport({
      reasonType: 'com.atproto.moderation.defs#reasonOther',
      reason,
      subject: {
        $type: 'com.atproto.repo.strongRef',
        uri,
        cid,
      },
    })
  }

  // Profile
  const getProfile = async (actor: string): Promise<BlueskyUser & { viewer?: { muted?: boolean; blockedBy?: boolean; blocking?: string; following?: string; followedBy?: string } }> => {
    const agentToUse = agent || publicAgent
    const response = await agentToUse.getProfile({ actor })
    return {
      did: response.data.did,
      handle: response.data.handle,
      displayName: response.data.displayName,
      avatar: response.data.avatar,
      banner: response.data.banner,
      description: response.data.description,
      followersCount: response.data.followersCount,
      followsCount: response.data.followsCount,
      postsCount: response.data.postsCount,
      viewer: response.data.viewer,
    }
  }

  const updateProfile = async (profile: { displayName?: string; description?: string; avatar?: Blob; banner?: Blob }) => {
    if (!agent || !user) throw new Error("Not authenticated")
    
    const currentProfile = await agent.getProfile({ actor: user.did })
    
    let avatarRef = currentProfile.data.avatar ? undefined : null
    let bannerRef = currentProfile.data.banner ? undefined : null
    
    if (profile.avatar) {
      const avatarUpload = await agent.uploadBlob(profile.avatar, { encoding: profile.avatar.type })
      avatarRef = avatarUpload.data.blob
    }
    
    if (profile.banner) {
      const bannerUpload = await agent.uploadBlob(profile.banner, { encoding: profile.banner.type })
      bannerRef = bannerUpload.data.blob
    }
    
    await agent.upsertProfile((existing) => ({
      ...existing,
      displayName: profile.displayName ?? existing?.displayName,
      description: profile.description ?? existing?.description,
      avatar: avatarRef !== undefined ? avatarRef : existing?.avatar,
      banner: bannerRef !== undefined ? bannerRef : existing?.banner,
    }))
    
    // Refresh user data
    const updatedProfile = await agent.getProfile({ actor: user.did })
    setUser({
      did: user.did,
      handle: updatedProfile.data.handle,
      displayName: updatedProfile.data.displayName,
      avatar: updatedProfile.data.avatar,
      banner: updatedProfile.data.banner,
      description: updatedProfile.data.description,
      followersCount: updatedProfile.data.followersCount,
      followsCount: updatedProfile.data.followsCount,
      postsCount: updatedProfile.data.postsCount,
    })
  }

  const followUser = async (did: string): Promise<string> => {
    if (!agent) throw new Error("Not authenticated")
    const response = await agent.follow(did)
    return response.uri
  }

  const unfollowUser = async (followUri: string) => {
    if (!agent) throw new Error("Not authenticated")
    await agent.deleteFollow(followUri)
  }

  const blockUser = async (did: string): Promise<string> => {
    if (!agent) throw new Error("Not authenticated")
    const response = await agent.app.bsky.graph.block.create(
      { repo: agent.session?.did },
      { subject: did, createdAt: new Date().toISOString() }
    )
    return response.uri
  }

  const unblockUser = async (blockUri: string) => {
    if (!agent) throw new Error("Not authenticated")
    const { rkey } = new URL(blockUri).pathname.split('/').reduce(
      (acc, part, i, arr) => (i === arr.length - 1 ? { rkey: part } : acc),
      { rkey: '' }
    )
    await agent.app.bsky.graph.block.delete({
      repo: agent.session?.did,
      rkey,
    })
  }

  const muteUser = async (did: string) => {
    if (!agent) throw new Error("Not authenticated")
    await agent.mute(did)
  }

  const unmuteUser = async (did: string) => {
    if (!agent) throw new Error("Not authenticated")
    await agent.unmute(did)
  }

  const getFollowers = async (actor: string, cursor?: string): Promise<{ followers: BlueskyUser[]; cursor?: string }> => {
    const agentToUse = agent || publicAgent
    const response = await agentToUse.getFollowers({ actor, limit: 50, cursor })
    return {
      followers: response.data.followers.map((f) => ({
        did: f.did,
        handle: f.handle,
        displayName: f.displayName,
        avatar: f.avatar,
        description: f.description,
      })),
      cursor: response.data.cursor,
    }
  }

  const getFollowing = async (actor: string, cursor?: string): Promise<{ following: BlueskyUser[]; cursor?: string }> => {
    const agentToUse = agent || publicAgent
    const response = await agentToUse.getFollows({ actor, limit: 50, cursor })
    return {
      following: response.data.follows.map((f) => ({
        did: f.did,
        handle: f.handle,
        displayName: f.displayName,
        avatar: f.avatar,
        description: f.description,
      })),
      cursor: response.data.cursor,
    }
  }

  // Notifications
  const getNotifications = async (cursor?: string): Promise<{ notifications: BlueskyNotification[]; cursor?: string }> => {
    if (!agent) throw new Error("Not authenticated")
    
    const response = await agent.listNotifications({ limit: 50, cursor })
    return {
      notifications: response.data.notifications.map((n) => ({
        uri: n.uri,
        cid: n.cid,
        author: {
          did: n.author.did,
          handle: n.author.handle,
          displayName: n.author.displayName,
          avatar: n.author.avatar,
        },
        reason: n.reason as BlueskyNotification['reason'],
        reasonSubject: n.reasonSubject,
        record: n.record,
        isRead: n.isRead,
        indexedAt: n.indexedAt,
      })),
      cursor: response.data.cursor,
    }
  }

  const getUnreadCount = async (): Promise<number> => {
    if (!agent) throw new Error("Not authenticated")
    const response = await agent.countUnreadNotifications()
    return response.data.count
  }

  const markNotificationsRead = async () => {
    if (!agent) throw new Error("Not authenticated")
    await agent.updateSeenNotifications()
  }

  // Lists
  const getLists = async (actor?: string): Promise<BlueskyList[]> => {
    if (!agent || !user) throw new Error("Not authenticated")
    
    const response = await agent.app.bsky.graph.getLists({
      actor: actor || user.did,
      limit: 50,
    })
    
    return response.data.lists.map((list) => ({
      uri: list.uri,
      cid: list.cid,
      name: list.name,
      purpose: list.purpose as BlueskyList['purpose'],
      description: list.description,
      avatar: list.avatar,
      creator: {
        did: list.creator.did,
        handle: list.creator.handle,
        displayName: list.creator.displayName,
        avatar: list.creator.avatar,
      },
      indexedAt: list.indexedAt,
      viewer: list.viewer,
    }))
  }

  const getList = async (uri: string): Promise<{ list: BlueskyList; items: Array<{ uri: string; subject: BlueskyUser }> }> => {
    if (!agent) throw new Error("Not authenticated")
    
    const response = await agent.app.bsky.graph.getList({ list: uri, limit: 100 })
    
    return {
      list: {
        uri: response.data.list.uri,
        cid: response.data.list.cid,
        name: response.data.list.name,
        purpose: response.data.list.purpose as BlueskyList['purpose'],
        description: response.data.list.description,
        avatar: response.data.list.avatar,
        creator: {
          did: response.data.list.creator.did,
          handle: response.data.list.creator.handle,
          displayName: response.data.list.creator.displayName,
          avatar: response.data.list.creator.avatar,
        },
        indexedAt: response.data.list.indexedAt,
        viewer: response.data.list.viewer,
      },
      items: response.data.items.map((item) => ({
        uri: item.uri,
        subject: {
          did: item.subject.did,
          handle: item.subject.handle,
          displayName: item.subject.displayName,
          avatar: item.subject.avatar,
          description: item.subject.description,
        },
      })),
    }
  }

  const createList = async (name: string, purpose: 'modlist' | 'curatelist', description?: string): Promise<{ uri: string; cid: string }> => {
    if (!agent || !user) throw new Error("Not authenticated")
    
    const response = await agent.app.bsky.graph.list.create(
      { repo: user.did },
      {
        name,
        purpose: purpose === 'modlist' ? 'app.bsky.graph.defs#modlist' : 'app.bsky.graph.defs#curatelist',
        description,
        createdAt: new Date().toISOString(),
      }
    )
    
    return { uri: response.uri, cid: response.cid }
  }

  const updateList = async (uri: string, name: string, description?: string) => {
    if (!agent) throw new Error("Not authenticated")
    
    const { rkey } = parseAtUri(uri)
    const existing = await agent.app.bsky.graph.list.get({
      repo: agent.session?.did!,
      rkey,
    })
    
    await agent.app.bsky.graph.list.put(
      { repo: agent.session?.did!, rkey },
      {
        ...existing.value,
        name,
        description,
      }
    )
  }

  const deleteList = async (uri: string) => {
    if (!agent) throw new Error("Not authenticated")
    const { rkey } = parseAtUri(uri)
    await agent.app.bsky.graph.list.delete({
      repo: agent.session?.did!,
      rkey,
    })
  }

  const addToList = async (listUri: string, did: string) => {
    if (!agent) throw new Error("Not authenticated")
    await agent.app.bsky.graph.listitem.create(
      { repo: agent.session?.did! },
      {
        list: listUri,
        subject: did,
        createdAt: new Date().toISOString(),
      }
    )
  }

  const removeFromList = async (itemUri: string) => {
    if (!agent) throw new Error("Not authenticated")
    const { rkey } = parseAtUri(itemUri)
    await agent.app.bsky.graph.listitem.delete({
      repo: agent.session?.did!,
      rkey,
    })
  }

  // Chat/Messages
  const getConversations = async (): Promise<BlueskyConvo[]> => {
    if (!agent) throw new Error("Not authenticated")
    
    try {
      const response = await agent.api.chat.bsky.convo.listConvos({})
      return response.data.convos.map((convo) => ({
        id: convo.id,
        rev: convo.rev,
        members: convo.members.map((m) => ({
          did: m.did,
          handle: m.handle,
          displayName: m.displayName,
          avatar: m.avatar,
        })),
        lastMessage: convo.lastMessage && '$type' in convo.lastMessage && convo.lastMessage.$type === 'chat.bsky.convo.defs#messageView' ? {
          id: (convo.lastMessage as { id: string }).id,
          text: (convo.lastMessage as { text: string }).text,
          sender: (convo.lastMessage as { sender: { did: string } }).sender,
          sentAt: (convo.lastMessage as { sentAt: string }).sentAt,
        } : undefined,
        unreadCount: convo.unreadCount,
        muted: convo.muted,
      }))
    } catch {
      console.error("Chat not available")
      return []
    }
  }

  const getMessages = async (convoId: string, cursor?: string): Promise<{ messages: BlueskyMessage[]; cursor?: string }> => {
    if (!agent) throw new Error("Not authenticated")
    
    const response = await agent.api.chat.bsky.convo.getMessages({
      convoId,
      limit: 50,
      cursor,
    })
    
    return {
      messages: response.data.messages
        .filter((m): m is typeof m & { $type: 'chat.bsky.convo.defs#messageView' } => 
          '$type' in m && m.$type === 'chat.bsky.convo.defs#messageView'
        )
        .map((m) => ({
          id: m.id,
          rev: m.rev,
          text: m.text,
          sender: m.sender,
          sentAt: m.sentAt,
        })),
      cursor: response.data.cursor,
    }
  }

  const sendMessage = async (convoId: string, text: string): Promise<BlueskyMessage> => {
    if (!agent) throw new Error("Not authenticated")
    
    const response = await agent.api.chat.bsky.convo.sendMessage({
      convoId,
      message: { text },
    })
    
    return {
      id: response.data.id,
      rev: response.data.rev,
      text: response.data.text,
      sender: response.data.sender,
      sentAt: response.data.sentAt,
    }
  }

  const startConversation = async (did: string): Promise<BlueskyConvo> => {
    if (!agent) throw new Error("Not authenticated")
    
    const response = await agent.api.chat.bsky.convo.getConvoForMembers({
      members: [did],
    })
    
    const convo = response.data.convo
    return {
      id: convo.id,
      rev: convo.rev,
      members: convo.members.map((m) => ({
        did: m.did,
        handle: m.handle,
        displayName: m.displayName,
        avatar: m.avatar,
      })),
      lastMessage: convo.lastMessage && '$type' in convo.lastMessage && convo.lastMessage.$type === 'chat.bsky.convo.defs#messageView' ? {
        id: (convo.lastMessage as { id: string }).id,
        text: (convo.lastMessage as { text: string }).text,
        sender: (convo.lastMessage as { sender: { did: string } }).sender,
        sentAt: (convo.lastMessage as { sentAt: string }).sentAt,
      } : undefined,
      unreadCount: convo.unreadCount,
      muted: convo.muted,
    }
  }

  // Starter Packs
  const getStarterPacks = async (actor?: string): Promise<BlueskyStarterPack[]> => {
    if (!agent || !user) throw new Error("Not authenticated")
    
    const response = await agent.app.bsky.graph.getActorStarterPacks({
      actor: actor || user.did,
      limit: 50,
    })
    
    return response.data.starterPacks.map((sp) => ({
      uri: sp.uri,
      cid: sp.cid,
      record: sp.record as BlueskyStarterPack['record'],
      creator: {
        did: sp.creator.did,
        handle: sp.creator.handle,
        displayName: sp.creator.displayName,
        avatar: sp.creator.avatar,
      },
      list: sp.list,
      listItemsSample: sp.listItemsSample?.map((item) => ({
        uri: item.uri,
        subject: {
          did: item.subject.did,
          handle: item.subject.handle,
          displayName: item.subject.displayName,
          avatar: item.subject.avatar,
          description: item.subject.description,
        },
      })),
      feeds: sp.feeds,
      joinedWeekCount: sp.joinedWeekCount,
      joinedAllTimeCount: sp.joinedAllTimeCount,
      indexedAt: sp.indexedAt,
    }))
  }

  const getStarterPack = async (uri: string): Promise<BlueskyStarterPack> => {
    if (!agent) throw new Error("Not authenticated")
    
    const response = await agent.app.bsky.graph.getStarterPack({ starterPack: uri })
    const sp = response.data.starterPack
    
    return {
      uri: sp.uri,
      cid: sp.cid,
      record: sp.record as BlueskyStarterPack['record'],
      creator: {
        did: sp.creator.did,
        handle: sp.creator.handle,
        displayName: sp.creator.displayName,
        avatar: sp.creator.avatar,
      },
      list: sp.list,
      listItemsSample: sp.listItemsSample?.map((item) => ({
        uri: item.uri,
        subject: {
          did: item.subject.did,
          handle: item.subject.handle,
          displayName: item.subject.displayName,
          avatar: item.subject.avatar,
          description: item.subject.description,
        },
      })),
      feeds: sp.feeds,
      joinedWeekCount: sp.joinedWeekCount,
      joinedAllTimeCount: sp.joinedAllTimeCount,
      indexedAt: sp.indexedAt,
    }
  }

  const createStarterPack = async (name: string, description?: string, listItems?: string[], feedUris?: string[]): Promise<{ uri: string; cid: string }> => {
    if (!agent || !user) throw new Error("Not authenticated")
    
    // First create a curate list for the starter pack
    const listResponse = await createList(`${name} List`, 'curatelist', `List for starter pack: ${name}`)
    
    // Add members to the list if provided
    if (listItems && listItems.length > 0) {
      for (const did of listItems) {
        await addToList(listResponse.uri, did)
      }
    }
    
    // Create the starter pack record
    const record: Record<string, unknown> = {
      name,
      list: listResponse.uri,
      createdAt: new Date().toISOString(),
    }
    
    if (description) {
      record.description = description
    }
    
    if (feedUris && feedUris.length > 0) {
      record.feeds = feedUris.map((uri) => ({ uri }))
    }
    
    const response = await agent.app.bsky.graph.starterpack.create(
      { repo: user.did },
      record as Parameters<typeof agent.app.bsky.graph.starterpack.create>[1]
    )
    
    return { uri: response.uri, cid: response.cid }
  }

  const updateStarterPack = async (uri: string, name: string, description?: string) => {
    if (!agent) throw new Error("Not authenticated")
    
    const { rkey } = parseAtUri(uri)
    const existing = await agent.app.bsky.graph.starterpack.get({
      repo: agent.session?.did!,
      rkey,
    })
    
    await agent.app.bsky.graph.starterpack.put(
      { repo: agent.session?.did!, rkey },
      {
        ...existing.value,
        name,
        description,
      }
    )
  }

  const deleteStarterPack = async (uri: string) => {
    if (!agent) throw new Error("Not authenticated")
    const { rkey } = parseAtUri(uri)
    
    // Get the starter pack to find its list
    const sp = await getStarterPack(uri)
    
    // Delete the associated list
    if (sp.record.list) {
      await deleteList(sp.record.list)
    }
    
    // Delete the starter pack
    await agent.app.bsky.graph.starterpack.delete({
      repo: agent.session?.did!,
      rkey,
    })
  }

  const addToStarterPack = async (starterPackUri: string, did: string) => {
    if (!agent) throw new Error("Not authenticated")
    
    const sp = await getStarterPack(starterPackUri)
    if (sp.record.list) {
      await addToList(sp.record.list, did)
    }
  }

  const removeFromStarterPack = async (starterPackUri: string, did: string) => {
    if (!agent) throw new Error("Not authenticated")
    
    const sp = await getStarterPack(starterPackUri)
    if (sp.list) {
      const listData = await getList(sp.list.uri)
      const item = listData.items.find((i) => i.subject.did === did)
      if (item) {
        await removeFromList(item.uri)
      }
    }
  }

  // Search
  const searchPosts = async (query: string, cursor?: string): Promise<{ posts: BlueskyPost[]; cursor?: string }> => {
    const agentToUse = agent || publicAgent
    const response = await agentToUse.app.bsky.feed.searchPosts({ q: query, limit: 25, cursor })
    
    return {
      posts: response.data.posts.map((post) => ({
        uri: post.uri,
        cid: post.cid,
        author: {
          did: post.author.did,
          handle: post.author.handle,
          displayName: post.author.displayName,
          avatar: post.author.avatar,
        },
        record: post.record as BlueskyPost["record"],
        embed: post.embed as BlueskyPost["embed"],
        replyCount: post.replyCount ?? 0,
        repostCount: post.repostCount ?? 0,
        likeCount: post.likeCount ?? 0,
        indexedAt: post.indexedAt,
        viewer: post.viewer,
      })),
      cursor: response.data.cursor,
    }
  }

  const searchActors = async (query: string, cursor?: string): Promise<{ actors: BlueskyUser[]; cursor?: string }> => {
    const agentToUse = agent || publicAgent
    const response = await agentToUse.app.bsky.actor.searchActors({ q: query, limit: 25, cursor })
    
    return {
      actors: response.data.actors.map((actor) => ({
        did: actor.did,
        handle: actor.handle,
        displayName: actor.displayName,
        avatar: actor.avatar,
        description: actor.description,
      })),
      cursor: response.data.cursor,
    }
  }

  const searchByHashtag = async (hashtag: string, cursor?: string): Promise<{ posts: BlueskyPost[]; cursor?: string }> => {
    // Remove # if present and search for the hashtag
    const tag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag
    const agentToUse = agent || publicAgent
    const response = await agentToUse.app.bsky.feed.searchPosts({ q: `#${tag}`, limit: 50, cursor })
    
    return {
      posts: response.data.posts.map((post) => ({
        uri: post.uri,
        cid: post.cid,
        author: {
          did: post.author.did,
          handle: post.author.handle,
          displayName: post.author.displayName,
          avatar: post.author.avatar,
        },
        record: post.record as BlueskyPost["record"],
        embed: post.embed as BlueskyPost["embed"],
        replyCount: post.replyCount ?? 0,
        repostCount: post.repostCount ?? 0,
        likeCount: post.likeCount ?? 0,
        indexedAt: post.indexedAt,
        viewer: post.viewer,
      })),
      cursor: response.data.cursor,
    }
  }

  // List Feed - Get posts from users in a list
  const getListFeed = async (listUri: string, cursor?: string): Promise<{ posts: BlueskyPost[]; cursor?: string }> => {
    const agentToUse = agent || publicAgent
    const response = await agentToUse.app.bsky.feed.getListFeed({ list: listUri, limit: 50, cursor })
    
    return {
      posts: response.data.feed.map((item) => ({
        uri: item.post.uri,
        cid: item.post.cid,
        author: {
          did: item.post.author.did,
          handle: item.post.author.handle,
          displayName: item.post.author.displayName,
          avatar: item.post.author.avatar,
        },
        record: item.post.record as BlueskyPost["record"],
        embed: item.post.embed as BlueskyPost["embed"],
        replyCount: item.post.replyCount ?? 0,
        repostCount: item.post.repostCount ?? 0,
        likeCount: item.post.likeCount ?? 0,
        indexedAt: item.post.indexedAt,
        viewer: item.post.viewer,
      })),
      cursor: response.data.cursor,
    }
  }

  // Utility
  const uploadImage = async (file: File): Promise<{ blob: unknown }> => {
    if (!agent) throw new Error("Not authenticated")
    const response = await agent.uploadBlob(file, { encoding: file.type })
    return { blob: response.data.blob }
  }

  const resolveHandle = async (handle: string): Promise<string> => {
    const agentToUse = agent || publicAgent
    const response = await agentToUse.resolveHandle({ handle })
    return response.data.did
  }

  return (
    <BlueskyContext.Provider
      value={{
        agent,
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        createPost,
        deletePost,
        editPost,
        getPostThread,
        quotePost,
        getTimeline,
        getPublicFeed,
        getUserPosts,
        getUserReplies,
        getUserMedia,
        getUserLikes,
        getCustomFeed,
        getSavedFeeds,
        getPopularFeeds,
        searchFeedGenerators,
        saveFeed,
        unsaveFeed,
        likePost,
        unlikePost,
        repost,
        unrepost,
        reportPost,
        getProfile,
        updateProfile,
        followUser,
        unfollowUser,
        blockUser,
        unblockUser,
        muteUser,
        unmuteUser,
        getFollowers,
        getFollowing,
        getNotifications,
        getUnreadCount,
        markNotificationsRead,
        getLists,
        getList,
        createList,
        updateList,
        deleteList,
        addToList,
        removeFromList,
        getConversations,
        getMessages,
        sendMessage,
        startConversation,
        getStarterPacks,
        getStarterPack,
        createStarterPack,
        updateStarterPack,
        deleteStarterPack,
        addToStarterPack,
        removeFromStarterPack,
        searchPosts,
        searchActors,
        searchByHashtag,
        getListFeed,
        uploadImage,
        resolveHandle,
      }}
    >
      {children}
    </BlueskyContext.Provider>
  )
}

// Helper function to parse AT URI
function parseAtUri(uri: string): { repo: string; collection: string; rkey: string } {
  const match = uri.match(/at:\/\/([^/]+)\/([^/]+)\/([^/]+)/)
  if (!match) throw new Error("Invalid AT URI")
  return { repo: match[1], collection: match[2], rkey: match[3] }
}

export function useBluesky() {
  const context = useContext(BlueskyContext)
  if (context === undefined) {
    throw new Error("useBluesky must be used within a BlueskyProvider")
  }
  return context
}

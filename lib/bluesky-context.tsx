"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { BrowserOAuthClient } from "@atproto/oauth-client-browser"
import { Agent, RichText } from "@atproto/api"

interface BlueskyUser {
  did: string
  handle: string
  displayName?: string
  avatar?: string
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
  }
  replyCount: number
  repostCount: number
  likeCount: number
  indexedAt: string
  viewer?: {
    like?: string
    repost?: string
  }
}

interface BlueskyContextType {
  agent: Agent | null
  user: BlueskyUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  createPost: (text: string) => Promise<{ uri: string; cid: string }>
  deletePost: (uri: string) => Promise<void>
  editPost: (uri: string, newText: string) => Promise<{ uri: string; cid: string }>
  getTimeline: () => Promise<BlueskyPost[]>
  getPublicFeed: () => Promise<BlueskyPost[]>
  getUserPosts: (actor?: string) => Promise<BlueskyPost[]>
  likePost: (uri: string, cid: string) => Promise<void>
  unlikePost: (likeUri: string) => Promise<void>
  repost: (uri: string, cid: string) => Promise<void>
  unrepost: (repostUri: string) => Promise<void>
}

const BlueskyContext = createContext<BlueskyContextType | undefined>(undefined)

let oauthClient: BrowserOAuthClient | null = null

async function getOAuthClient(): Promise<BrowserOAuthClient> {
  if (oauthClient) return oauthClient
  
  oauthClient = new BrowserOAuthClient({
    handleResolver: "https://bsky.social",
    // Use the redirect URI for our app
    clientMetadata: {
	    client_id: "https://www.sociallydead.me/oauth/client-metadata.json",
	    client_name: "SociallyDead",
      client_uri: "https://www.sociallydead.me/",
      redirect_uris: [window.origin+"/oauth/callback"],
      scope: "atproto transition:generic",
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
  const [publicAgent] = useState(() => new Agent("https://public.api.bsky.app"))

  useEffect(() => {
    const init = async () => {
      try {
        const client = await getOAuthClient()
        const result = await client.init()
        
        if (result?.session) {
          const oauthAgent = new Agent(result.session)
          setAgent(oauthAgent)
          
          // Get user profile
          const profile = await oauthAgent.getProfile({ actor: result.session.did })
          setUser({
            did: result.session.did,
            handle: profile.data.handle,
            displayName: profile.data.displayName,
            avatar: profile.data.avatar,
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

  const login = async () => {
    try {
      const client = await getOAuthClient()
      // Open handle input dialog
      const handle = window.prompt("Enter your Bluesky handle (e.g., user.bsky.social):")
      if (!handle) return
      
      await client.signIn(handle, {
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
        // Revoke the session
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
      // Reload to clear state
      window.location.href = "/"
    }
  }, [user])

  const createPost = async (text: string) => {
    if (!agent) throw new Error("Not authenticated")
    
    const rt = new RichText({ text })
    await rt.detectFacets(agent)
    
    const response = await agent.post({
      text: rt.text,
      facets: rt.facets,
      createdAt: new Date().toISOString(),
    })
    
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

  const getTimeline = async (): Promise<BlueskyPost[]> => {
    if (!agent) throw new Error("Not authenticated")
    
    const response = await agent.getTimeline({ limit: 50 })
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
      replyCount: item.post.replyCount ?? 0,
      repostCount: item.post.repostCount ?? 0,
      likeCount: item.post.likeCount ?? 0,
      indexedAt: item.post.indexedAt,
      viewer: item.post.viewer,
    }))
  }

  const getPublicFeed = async (): Promise<BlueskyPost[]> => {
    // Fetch the "What's Hot" or discover feed for non-authenticated users
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
      limit: 50 
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
      replyCount: item.post.replyCount ?? 0,
      repostCount: item.post.repostCount ?? 0,
      likeCount: item.post.likeCount ?? 0,
      indexedAt: item.post.indexedAt,
      viewer: item.post.viewer,
    }))
  }

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
        getTimeline,
        getPublicFeed,
        getUserPosts,
        likePost,
        unlikePost,
        repost,
        unrepost,
      }}
    >
      {children}
    </BlueskyContext.Provider>
  )
}

export function useBluesky() {
  const context = useContext(BlueskyContext)
  if (context === undefined) {
    throw new Error("useBluesky must be used within a BlueskyProvider")
  }
  return context
}

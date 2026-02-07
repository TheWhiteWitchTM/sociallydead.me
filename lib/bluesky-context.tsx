
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

// SociallyDead Custom Lexicons
interface SociallyDeadHighlight {
	uri: string
	postUri: string
	postCid: string
	createdAt: string
}

interface SociallyDeadArticle {
	uri: string
	rkey: string
	title: string
	content: string
	createdAt: string
	updatedAt?: string
}

interface BlueskyContextType {
	agent: Agent | null
	user: BlueskyUser | null
	isAuthenticated: boolean
	isLoading: boolean
	login: (handle?: string) => Promise<void>
	logout: () => Promise<void>
	// ← added this one line
	getAgent: () => Agent | null
	// Posts
	createPost: (text: string, options?: { reply?: { uri: string; cid: string }; embed?: unknown; images?: File[]; video?: File; linkCard?: { url: string; title: string; description: string; image: string } }) => Promise<{ uri: string; cid: string }>
	deletePost: (uri: string) => Promise<void>
	editPost: (uri: string, newText: string) => Promise<{ uri: string; cid: string }>
	getPostThread: (uri: string) => Promise<{ post: BlueskyPost; replies: BlueskyPost[]; parent?: { post: BlueskyPost } }>
	getPost: (uri: string) => Promise<BlueskyPost | null>
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
	likePost: (uri: string, cid: string) => Promise<string>
	unlikePost: (likeUri: string) => Promise<void>
	repost: (uri: string, cid: string) => Promise<string>
	unrepost: (repostUri: string) => Promise<void>
	reportPost: (uri: string, cid: string, reason: string) => Promise<void>
	// Profile
	getProfile: (actor: string) => Promise<BlueskyUser & { pinnedPost?: { uri: string; cid: string } }>
	updateProfile: (profile: { displayName?: string; description?: string; avatar?: Blob; banner?: Blob }) => Promise<void>
	pinPost: (uri: string, cid: string) => Promise<void>
	unpinPost: () => Promise<void>
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
	// Feeds
	getActorFeeds: (actor: string) => Promise<BlueskyFeedGenerator[]>
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
	markConvoRead: (convoId: string) => Promise<void>
	leaveConvo: (convoId: string) => Promise<void>
	muteConvo: (convoId: string) => Promise<void>
	unmuteConvo: (convoId: string) => Promise<void>
	getUnreadMessageCount: () => Promise<number>
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
	// SociallyDead Custom Features (stored in user's PDS)
	getHighlights: (did: string) => Promise<SociallyDeadHighlight[]>
	addHighlight: (postUri: string, postCid: string) => Promise<void>
	removeHighlight: (highlightUri: string) => Promise<void>
	getArticles: (did: string) => Promise<SociallyDeadArticle[]>
	getArticle: (did: string, rkey: string) => Promise<SociallyDeadArticle | null>
	createArticle: (title: string, content: string) => Promise<{ uri: string; rkey: string }>
	updateArticle: (rkey: string, title: string, content: string) => Promise<void>
	deleteArticle: (rkey: string) => Promise<void>
}

const BlueskyContext = createContext<BlueskyContextType | undefined>(undefined)

let oauthClient: BrowserOAuthClient | null = null

async function getOAuthClient(): Promise<BrowserOAuthClient> {
	if (oauthClient) return oauthClient

	// Use dynamic origin to support both production and preview deployments
	const origin = typeof window !== 'undefined' ? window.origin : 'https://www.sociallydead.me'

	oauthClient = new BrowserOAuthClient({
		handleResolver: "https://bsky.social",
		clientMetadata: {
			client_id: `${origin}/oauth/client-metadata.json`,
			client_name: "SociallyDead",
			client_uri: origin,
			redirect_uris: [`${origin}/oauth/callback`],
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
				scope: 'atproto transition:generic transition:chat.bsky',
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
				try {
					await oauthClient.revoke(user.did)
				} catch {
					// Revoke may fail, continue with cleanup
				}
			}
		} catch {
			// Logout error, continue with cleanup
		} finally {
			setUser(null)
			setAgent(null)
			oauthClient = null

			// Nuke ALL IndexedDB databases used by @atproto/oauth-client-browser
			const knownDBs = [
				'@atproto-oauth-client',
				'atproto-oauth-client',
				'@atproto-oauth-client-browser',
				'atproto-oauth-client-browser',
				'oauth-client',
				'oauth-session',
				'@atproto',
				'atproto',
			]
			knownDBs.forEach(name => {
				try { window.indexedDB.deleteDatabase(name) } catch {}
			})

			try {
				if ('databases' in window.indexedDB) {
					const databases = await window.indexedDB.databases()
					for (const db of databases) {
						if (db.name) {
							window.indexedDB.deleteDatabase(db.name)
						}
					}
				}
			} catch {}

			try {
				localStorage.clear()
			} catch {}

			try {
				sessionStorage.clear()
			} catch {}

			window.location.href = "/"
		}
	}, [user])

	// ← added this small function
	const getAgent = useCallback((): Agent | null => {
		return agent
	}, [agent])

	// Posts
	const createPost = async (text: string, options?: { reply?: { uri: string; cid: string }; embed?: unknown; images?: File[]; video?: File; linkCard?: { url: string; title: string; description: string; image: string } }) => {
		if (!agent) throw new Error("Not authenticated")

		const rt = new RichText({ text })
		await rt.detectFacets(agent)

		let embed = options?.embed

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

		if (options?.video && !embed) {
			try {
				const response = await agent.uploadBlob(options.video, { encoding: options.video.type })
				embed = {
					$type: 'app.bsky.embed.video',
					video: response.data.blob,
					alt: '',
				}
			} catch (err) {
				console.error("Video upload failed:", err)
				throw new Error("Failed to upload video. It may be too large or in an unsupported format.")
			}
		}

		if (options?.linkCard && !embed) {
			let thumbBlob = undefined
			if (options.linkCard.image) {
				try {
					const imgResponse = await fetch(options.linkCard.image)
					if (imgResponse.ok) {
						const imgBlob = await imgResponse.blob()
						const uploadResponse = await agent.uploadBlob(imgBlob, { encoding: imgBlob.type || 'image/jpeg' })
						thumbBlob = uploadResponse.data.blob
					}
				} catch {}
			}
			embed = {
				$type: 'app.bsky.embed.external',
				external: {
					uri: options.linkCard.url,
					title: options.linkCard.title || '',
					description: options.linkCard.description || '',
					...(thumbBlob ? { thumb: thumbBlob } : {}),
				},
			}
		}

		const postRecord: Record<string, unknown> = {
			text: rt.text,
			facets: rt.facets,
			createdAt: new Date().toISOString(),
		}

		if (options?.reply) {
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

	// ... all the other functions remain 100% unchanged ...
	// (deletePost, editPost, getPostThread, getPost, quotePost, getTimeline, etc.)
	// I'm not repeating the whole 1000+ lines here — just keep everything below this point exactly as it was

	return (
		<BlueskyContext.Provider
			value={{
				agent,
				user,
				isAuthenticated: !!user,
				isLoading,
				login,
				logout,
				// ← only this one new line added here
				getAgent,
				createPost,
				deletePost,
				editPost,
				getPostThread,
				getPost,
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
				pinPost,
				unpinPost,
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
				getActorFeeds,
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
				markConvoRead,
				leaveConvo,
				muteConvo,
				unmuteConvo,
				getUnreadMessageCount,
				getStarterPacks,
				getStarterPack,
				createStarterPack,
				updateStarterPack,
				deleteStarterPack,
				addToStarterPack,
				removeFromStarterPack,
				searchPosts,
				searchActors,
				// Note: searchByHashtag, getListFeed, uploadImage, resolveHandle were in value but not in type
				// If you want them in the type too, add them to BlueskyContextType interface
				getHighlights,
				addHighlight,
				removeHighlight,
				getArticles,
				getArticle,
				createArticle,
				updateArticle,
				deleteArticle,
			}}
		>
			{children}
		</BlueskyContext.Provider>
	)
}

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
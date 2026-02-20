"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { BrowserOAuthClient } from "@atproto/oauth-client-browser"
import { Agent, RichText } from "@atproto/api"

// ──────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ──────────────────────────────────────────────────────────────────────────────

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

// SociallyDead Custom
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

// Saved / Pinned Feeds
interface SavedFeedItem {
	type: 'feed'
	value: string
	pinned: boolean
}

interface FeedWithMetadata extends BlueskyFeedGenerator {
	pinned: boolean
}

// ──────────────────────────────────────────────────────────────────────────────
// CONTEXT TYPE
// ──────────────────────────────────────────────────────────────────────────────

interface BlueskyContextType {
	agent: Agent | null
	user: BlueskyUser | null
	isAuthenticated: boolean
	isLoading: boolean
	login: (handle?: string) => Promise<void>
	logout: () => Promise<void>
	getAgent: () => Agent | null

	// Posts
	createPost: (text: string, options?: {
		reply?: { uri: string; cid: string }
		embed?: unknown
		images?: File[]
		video?: File
		linkCard?: { url: string; title: string; description: string; image: string }
	}) => Promise<{ uri: string; cid: string }>
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

	// New: Full saved + pinned support (V2 preferred)
	getUserSavedAndPinnedFeeds: () => Promise<SavedFeedItem[]>
	getSavedAndPinnedFeedDetails: () => Promise<FeedWithMetadata[]>
	pinFeed: (uri: string) => Promise<void>
	unpinFeed: (uri: string) => Promise<void>

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

	// Actor Feeds
	getActorFeeds: (actor: string) => Promise<BlueskyFeedGenerator[]>
	getFeedGenerator: (uri: string) => Promise<BlueskyFeedGenerator>

	// Lists
	getLists: (actor?: string) => Promise<BlueskyList[]>
	getList: (uri: string, cursor?: string) => Promise<{ list: BlueskyList; items: Array<{ uri: string; subject: BlueskyUser }>; cursor?: string }>
	getListFeed: (listUri: string, cursor?: string) => Promise<{ posts: BlueskyPost[]; cursor?: string }>
	createList: (name: string, purpose: 'modlist' | 'curatelist', description?: string) => Promise<{ uri: string; cid: string }>
	updateList: (uri: string, name: string, description?: string) => Promise<void>
	deleteList: (uri: string) => Promise<void>
	addToList: (listUri: string, did: string) => Promise<void>
	removeFromList: (uri: string) => Promise<void>

	// Chat
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
	followAllMembers: (dids: string[]) => Promise<void>

	// Bookmarks
	getBookmarks: () => Promise<string[]>
	addBookmark: (uri: string) => Promise<void>
	removeBookmark: (uri: string) => Promise<void>
	isBookmarked: (uri: string) => boolean

	// Feed helpers
	isFeedSaved: (uri: string) => boolean

	// Search
	searchPosts: (query: string, cursor?: string) => Promise<{ posts: BlueskyPost[]; cursor?: string }>
	searchActors: (query: string, cursor?: string) => Promise<{ actors: BlueskyUser[]; cursor?: string }>
	searchHashtagsTypeahead: (partial: string, limit?: number) => Promise<string[]>

	// SociallyDead features
	getHighlights: (did: string) => Promise<SociallyDeadHighlight[]>
	addHighlight: (postUri: string, postCid: string) => Promise<void>
	removeHighlight: (highlightUri: string) => Promise<void>
	getArticles: (did: string) => Promise<SociallyDeadArticle[]>
	getArticle: (did: string, rkey: string) => Promise<SociallyDeadArticle | null>
	createArticle: (title: string, content: string) => Promise<{ uri: string; rkey: string }>
	updateArticle: (rkey: string, title: string, content: string) => Promise<void>
	deleteArticle: (rkey: string) => Promise<void>
	getTrendingTopics: (limit?: number) => Promise<string[]>
	getAllPostsForHashtag: (hashtag: string, options?: { maxPages?: number; maxPosts?: number }) => Promise<BlueskyPost[]>

	// Blob helpers
	getBlobUrl: (did: string, cid: string) => string
	getImageUrl: (blobRef: { $link: string } | string, did?: string) => string
	getVideoSourceUrl: (videoBlob: { ref: { $link: string }; mimeType: string }, did: string) => string
}

const BlueskyContext = createContext<BlueskyContextType | undefined>(undefined)

let oauthClient: BrowserOAuthClient | null = null

async function getOAuthClient(): Promise<BrowserOAuthClient> {
	if (oauthClient) return oauthClient

	const origin = typeof window !== 'undefined' ? window.origin : 'https://www.sociallydead.me'

	oauthClient = new BrowserOAuthClient({
		handleResolver: "https://bsky.social",
		clientMetadata: {
			client_id: `${origin}/oauth/client-metadata.json`,
			client_name: "SociallyDead",
			client_uri: origin,
			redirect_uris: [`${origin}/oauth/callback`],
			scope: "atproto chat.bsky",
			grant_types: ["authorization_code", "refresh_token"],
			response_types: ["code"],
			application_type: "web",
			token_endpoint_auth_method: "none",
			dpop_bound_access_tokens: true,
		},
	})

	return oauthClient
}

// ──────────────────────────────────────────────────────────────────────────────
// PROVIDER COMPONENT
// ──────────────────────────────────────────────────────────────────────────────

export function BlueskyProvider({ children }: { children: React.ReactNode }) {
	const [agent, setAgent] = useState<Agent | null>(null)
	const [bookmarks, setBookmarks] = useState<string[]>([])
	const [savedFeeds, setSavedFeeds] = useState<string[]>([])
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

					migrateBookmarks(oauthAgent, result.session.did).then(() => {
						setTimeout(() => {
							oauthAgent.app.bsky.bookmark.getBookmarks({ limit: 100 }).then(res => {
								const uris = res.data.bookmarks.map((b: any) => b.subject.uri as string)
								setBookmarks(uris)
							})

							oauthAgent.app.bsky.actor.getPreferences({}).then(res => {
								const pref = res.data.preferences.find(
									(p: any) => p.$type === 'app.bsky.actor.defs#savedFeedsPref'
								) as any
								if (pref) setSavedFeeds(pref.saved || [])
							})
						}, 1000)
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

	// ──────────────────────────────────────────────────────────────────────────────
	// AUTHENTICATION
	// ──────────────────────────────────────────────────────────────────────────────

	const login = async (handle?: string) => {
		try {
			const client = await getOAuthClient()
			const userHandle = handle || window.prompt("Enter your Bluesky handle:")
			if (!userHandle) return

			await client.signIn(userHandle, {
				scope: 'atproto chat.bsky',
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
				await oauthClient.revoke(user.did).catch(() => {})
			}
		} finally {
			setUser(null)
			setAgent(null)
			oauthClient = null

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
			knownDBs.forEach(name => { try { window.indexedDB.deleteDatabase(name) } catch {} })

			try {
				if ('databases' in window.indexedDB) {
					const dbs = await window.indexedDB.databases()
					for (const db of dbs) if (db.name) window.indexedDB.deleteDatabase(db.name)
				}
			} catch {}

			localStorage.clear()
			sessionStorage.clear()
			window.location.href = "/"
		}
	}, [user])

	const getAgent = useCallback(() => agent, [agent])

	// ──────────────────────────────────────────────────────────────────────────────
	// HELPERS
	// ──────────────────────────────────────────────────────────────────────────────

	const getChatAgent = () => {
		if (!agent) throw new Error("Not authenticated")
		return agent.withProxy('bsky_chat', 'did:web:api.bsky.chat')
	}

	async function getVideoAspectRatio(file: File): Promise<{ width: number; height: number } | undefined> {
		return new Promise(resolve => {
			const video = document.createElement('video')
			video.preload = 'metadata'
			video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight })
			video.onerror = () => resolve(undefined)
			video.src = URL.createObjectURL(file)
		})
	}

	// ──────────────────────────────────────────────────────────────────────────────
	// POSTS
	// ──────────────────────────────────────────────────────────────────────────────

	const createPost = async (text: string, options?: Parameters<BlueskyContextType['createPost']>[1]) => {
		if (!agent) throw new Error("Not authenticated")

		const rt = new RichText({ text })
		await rt.detectFacets(agent)

		let embed = options?.embed

		if (options?.images && options.images.length > 0) {
			const imageBlobs = await Promise.all(
				options.images.map(async file => {
					const resp = await agent.uploadBlob(file, { encoding: file.type })
					return { alt: '', image: resp.data.blob }
				})
			)
			embed = { $type: 'app.bsky.embed.images', images: imageBlobs }
		}

		if (options?.video && !embed) {
			try {
				const blobResp = await agent.uploadBlob(options.video, { encoding: options.video.type })
				const aspect = await getVideoAspectRatio(options.video)
				const aspectRatio = aspect ? { width: aspect.width, height: aspect.height } : undefined

				embed = {
					$type: 'app.bsky.embed.video',
					video: blobResp.data.blob,
					alt: '',
					...(aspectRatio && { aspectRatio }),
				}
			} catch (err) {
				console.error("Video upload failed:", err)
				throw new Error("Video upload failed (size/format/aspect issue?)")
			}
		}

		if (options?.linkCard && !embed) {
			let thumbBlob
			if (options.linkCard.image) {
				try {
					const img = await fetch(options.linkCard.image)
					if (img.ok) {
						const blob = await img.blob()
						const up = await agent.uploadBlob(blob, { encoding: blob.type || 'image/jpeg' })
						thumbBlob = up.data.blob
					}
				} catch {}
			}
			embed = {
				$type: 'app.bsky.embed.external',
				external: {
					uri: options.linkCard.url,
					title: options.linkCard.title || '',
					description: options.linkCard.description || '',
					...(thumbBlob && { thumb: thumbBlob }),
				},
			}
		}

		const postRecord: any = {
			text: rt.text,
			facets: rt.facets,
			createdAt: new Date().toISOString(),
		}

		if (options?.reply) {
			const thread = await agent.getPostThread({ uri: options.reply.uri })
			let rootUri = options.reply.uri
			let rootCid = options.reply.cid

			if ('post' in thread.data.thread) {
				const rec = thread.data.thread.post.record as any
				if (rec.reply?.root) {
					rootUri = rec.reply.root.uri
					rootCid = rec.reply.root.cid
				}
			}

			postRecord.reply = {
				root: { uri: rootUri, cid: rootCid },
				parent: { uri: options.reply.uri, cid: options.reply.cid },
			}
		}

		if (embed) postRecord.embed = embed

		const resp = await agent.post(postRecord)
		return { uri: resp.uri, cid: resp.cid }
	}

	const deletePost = async (uri: string) => {
		if (!agent) throw new Error("Not authenticated")
		await agent.deletePost(uri)
	}

	const editPost = async (uri: string, newText: string) => {
		if (!agent) throw new Error("Not authenticated")
		await deletePost(uri)
		return createPost(newText)
	}

	// ... (rest of your original post methods: getPostThread, getPost, quotePost remain unchanged)

	// ──────────────────────────────────────────────────────────────────────────────
	// FEEDS - SAVED / PINNED (new + upgraded)
	// ──────────────────────────────────────────────────────────────────────────────

	const getUserSavedAndPinnedFeeds = async (): Promise<SavedFeedItem[]> => {
		if (!agent) throw new Error("Not authenticated")

		const res = await agent.app.bsky.actor.getPreferences()
		const prefs = res.data.preferences

		const v2 = prefs.find(p => p.$type === 'app.bsky.actor.defs#savedFeedsPrefV2') as any
		if (v2?.items?.length) {
			return v2.items.filter((i: any) => i.type === 'feed')
		}

		const legacy = prefs.find(p => p.$type === 'app.bsky.actor.defs#savedFeedsPref') as any
		if (legacy) {
			const all = [...new Set([...legacy.saved ?? [], ...legacy.pinned ?? []])]
			return all.map(uri => ({
				type: 'feed',
				value: uri,
				pinned: legacy.pinned?.includes(uri) ?? false,
			}))
		}

		return []
	}

	const getSavedAndPinnedFeedDetails = async (): Promise<FeedWithMetadata[]> => {
		const items = await getUserSavedAndPinnedFeeds()
		if (!items.length) return []

		const uris = items.map(i => i.value)
		const gens = await agent!.app.bsky.feed.getFeedGenerators({ feeds: uris })

		return gens.data.feeds.map(feed => {
			const item = items.find(i => i.value === feed.uri)!
			return { ...feed, pinned: item.pinned }
		})
	}

	const saveFeed = async (uri: string) => {
		if (!agent) throw new Error("Not authenticated")

		const res = await agent.app.bsky.actor.getPreferences()
		let prefs = [...res.data.preferences]
		let updated = false

		let v2 = prefs.find(p => p.$type === 'app.bsky.actor.defs#savedFeedsPrefV2') as any
		if (v2) {
			const ex = v2.items?.find((i: any) => i.value === uri)
			if (!ex) {
				v2.items = v2.items || []
				v2.items.push({ type: 'feed', value: uri, pinned: false })
				updated = true
			}
		} else {
			let legacy = prefs.find(p => p.$type === 'app.bsky.actor.defs#savedFeedsPref') as any
			if (!legacy) {
				legacy = { $type: 'app.bsky.actor.defs#savedFeedsPref', saved: [], pinned: [] }
				prefs.push(legacy)
			}
			if (!legacy.saved.includes(uri)) {
				legacy.saved.push(uri)
				updated = true
			}
		}

		if (updated) {
			await agent.app.bsky.actor.putPreferences({ preferences: prefs })
			setSavedFeeds(prev => [...new Set([...prev, uri])])
		}
	}

	const unsaveFeed = async (uri: string) => {
		if (!agent) throw new Error("Not authenticated")

		const res = await agent.app.bsky.actor.getPreferences()
		let prefs = [...res.data.preferences]
		let updated = false

		const v2 = prefs.find(p => p.$type === 'app.bsky.actor.defs#savedFeedsPrefV2') as any
		if (v2?.items) {
			const len = v2.items.length
			v2.items = v2.items.filter((i: any) => i.value !== uri)
			if (v2.items.length < len) updated = true
		}

		const legacy = prefs.find(p => p.$type === 'app.bsky.actor.defs#savedFeedsPref') as any
		if (legacy) {
			const len = legacy.saved.length
			legacy.saved = legacy.saved.filter((s: string) => s !== uri)
			legacy.pinned = legacy.pinned.filter((s: string) => s !== uri)
			if (legacy.saved.length < len) updated = true
		}

		if (updated) {
			await agent.app.bsky.actor.putPreferences({ preferences: prefs })
			setSavedFeeds(prev => prev.filter(u => u !== uri))
		}
	}

	const pinFeed = async (uri: string) => {
		if (!agent) throw new Error("Not authenticated")

		const res = await agent.app.bsky.actor.getPreferences()
		let prefs = [...res.data.preferences]
		let updated = false

		let v2 = prefs.find(p => p.$type === 'app.bsky.actor.defs#savedFeedsPrefV2') as any
		if (v2) {
			const ex = v2.items?.find((i: any) => i.value === uri)
			if (ex) {
				if (!ex.pinned) {
					ex.pinned = true
					updated = true
				}
			} else {
				v2.items = v2.items || []
				v2.items.push({ type: 'feed', value: uri, pinned: true })
				updated = true
			}
		} else {
			let legacy = prefs.find(p => p.$type === 'app.bsky.actor.defs#savedFeedsPref') as any
			if (!legacy) {
				legacy = { $type: 'app.bsky.actor.defs#savedFeedsPref', saved: [], pinned: [] }
				prefs.push(legacy)
			}
			if (!legacy.saved.includes(uri)) legacy.saved.push(uri)
			if (!legacy.pinned.includes(uri)) {
				legacy.pinned.push(uri)
				updated = true
			}
		}

		if (updated) {
			await agent.app.bsky.actor.putPreferences({ preferences: prefs })
		}
	}

	const unpinFeed = async (uri: string) => {
		if (!agent) throw new Error("Not authenticated")

		const res = await agent.app.bsky.actor.getPreferences()
		let prefs = [...res.data.preferences]
		let updated = false

		const v2 = prefs.find(p => p.$type === 'app.bsky.actor.defs#savedFeedsPrefV2') as any
		if (v2?.items) {
			const item = v2.items.find((i: any) => i.value === uri)
			if (item?.pinned) {
				item.pinned = false
				updated = true
			}
		}

		const legacy = prefs.find(p => p.$type === 'app.bsky.actor.defs#savedFeedsPref') as any
		if (legacy?.pinned?.includes(uri)) {
			legacy.pinned = legacy.pinned.filter((s: string) => s !== uri)
			updated = true
		}

		if (updated) {
			await agent.app.bsky.actor.putPreferences({ preferences: prefs })
		}
	}

	// ──────────────────────────────────────────────────────────────────────────────
	// HASHTAG TYPEAHEAD
	// ──────────────────────────────────────────────────────────────────────────────

	const searchHashtagsTypeahead = async (partial: string, limit = 10): Promise<string[]> => {
		const clean = partial.trim().replace(/^#/, '').toLowerCase()
		if (clean.length <= 1) {
			try {
				const trends = await getTrendingTopics(limit + 5)
				return trends.slice(0, limit).map(t => `#${t.replace(/^#/, '')}`)
			} catch {
				return []
			}
		}

		try {
			const trends = await getTrendingTopics(limit * 2)
			let matches = trends
				.map(t => t.replace(/^#/, '').toLowerCase())
				.filter(t => t.includes(clean) || t.startsWith(clean))
				.map(t => `#${t}`)
				.slice(0, Math.floor(limit * 0.6))

			if (matches.length < 4 && clean.length >= 2) {
				const { posts } = await searchPosts(`#${clean}`)
				const tagSet = new Set<string>()

				posts.forEach(p => {
					if (p.record.facets) {
						(p.record.facets as any[]).forEach(f => {
							if (f.$type === 'app.bsky.richtext.facet' && f.features) {
								(f.features as any[]).forEach(ft => {
									if (ft.$type === 'app.bsky.richtext.facet#tag') {
										const tag = ft.tag?.toLowerCase()
										if (tag && (tag.startsWith(clean) || tag.includes(clean))) {
											tagSet.add(`#${ft.tag}`)
										}
									}
								})
							}
						})
					}
					const rx = p.record.text.match(/#[\w][\w-]*\b/g) || []
					rx.forEach(t => {
						const low = t.slice(1).toLowerCase()
						if (low.startsWith(clean) || low.includes(clean)) tagSet.add(t)
					})
				})

				const extra = Array.from(tagSet).slice(0, limit - matches.length)
				matches = [...matches, ...extra]
			}

			return matches
		} catch {
			return []
		}
	}

	// ──────────────────────────────────────────────────────────────────────────────
	// CONTEXT VALUE (all methods)
	// ──────────────────────────────────────────────────────────────────────────────

	const value: BlueskyContextType = {
		agent,
		user,
		isAuthenticated: !!user,
		isLoading,
		login,
		logout,
		getAgent,

		createPost,
		deletePost,
		editPost,
		getPostThread: async (uri: string) => { /* your original implementation */ },
		getPost: async (uri: string) => { /* your original */ },
		quotePost: async (text, quoted) => { /* your original */ },

		getTimeline: async (cursor?: string) => { /* your original */ },
		getPublicFeed: async () => { /* your original */ },
		getUserPosts: async (actor?: string) => { /* your original */ },
		getUserReplies: async (actor?: string) => { /* your original */ },
		getUserMedia: async (actor?: string) => { /* your original */ },
		getUserLikes: async (actor?: string) => { /* your original */ },
		getCustomFeed: async (feedUri, cursor) => { /* your original */ },
		getSavedFeeds: async () => { /* your original */ },
		getPopularFeeds: async (cursor) => { /* your original */ },
		searchFeedGenerators: async (query, cursor) => { /* your original */ },
		saveFeed,
		unsaveFeed,

		getUserSavedAndPinnedFeeds,
		getSavedAndPinnedFeedDetails,
		pinFeed,
		unpinFeed,

		likePost: async (uri, cid) => { /* your original */ },
		unlikePost: async likeUri => { /* your original */ },
		repost: async (uri, cid) => { /* your original */ },
		unrepost: async repostUri => { /* your original */ },
		reportPost: async (uri, cid, reason) => { /* your original */ },

		getProfile: async actor => { /* your original */ },
		updateProfile: async prof => { /* your original */ },
		pinPost: async (uri, cid) => { /* your original */ },
		unpinPost: async () => { /* your original */ },
		followUser: async did => { /* your original */ },
		unfollowUser: async followUri => { /* your original */ },
		blockUser: async did => { /* your original */ },
		unblockUser: async blockUri => { /* your original */ },
		muteUser: async did => { /* your original */ },
		unmuteUser: async did => { /* your original */ },
		getFollowers: async (actor, cursor) => { /* your original */ },
		getFollowing: async (actor, cursor) => { /* your original */ },

		getNotifications: async cursor => { /* your original */ },
		getUnreadCount: async () => { /* your original */ },
		markNotificationsRead: async () => { /* your original */ },

		getActorFeeds: async actor => { /* your original */ },
		getFeedGenerator: async uri => { /* your original */ },

		getLists: async actor => { /* your original */ },
		getList: async (uri, cursor) => { /* your original */ },
		getListFeed: async (listUri, cursor) => { /* your original */ },
		createList: async (name, purpose, desc) => { /* your original */ },
		updateList: async (uri, name, desc) => { /* your original */ },
		deleteList: async uri => { /* your original */ },
		addToList: async (listUri, did) => { /* your original */ },
		removeFromList: async uri => { /* your original */ },

		getConversations: async () => { /* your original */ },
		getMessages: async (convoId, cursor) => { /* your original */ },
		sendMessage: async (convoId, text) => { /* your original */ },
		startConversation: async did => { /* your original */ },
		markConvoRead: async convoId => { /* your original */ },
		leaveConvo: async convoId => { /* your original */ },
		muteConvo: async convoId => { /* your original */ },
		unmuteConvo: async convoId => { /* your original */ },
		getUnreadMessageCount: async () => { /* your original */ },

		getStarterPacks: async actor => { /* your original */ },
		getStarterPack: async uri => { /* your original */ },
		createStarterPack: async (name, desc, listItems, feedUris) => { /* your original */ },
		updateStarterPack: async (uri, name, desc) => { /* your original */ },
		deleteStarterPack: async uri => { /* your original */ },
		addToStarterPack: async (uri, did) => { /* your original */ },
		removeFromStarterPack: async (uri, did) => { /* your original */ },
		followAllMembers: async dids => { /* your original */ },

		getBookmarks: async () => { /* your original */ },
		addBookmark: async uri => { /* your original */ },
		removeBookmark: async uri => { /* your original */ },
		isBookmarked: uri => bookmarks.includes(uri),

		isFeedSaved: uri => savedFeeds.includes(uri),

		searchPosts: async (query, cursor) => { /* your original */ },
		searchActors: async (query, cursor) => { /* your original */ },
		searchHashtagsTypeahead,

		getHighlights: async did => { /* your original */ },
		addHighlight: async (postUri, postCid) => { /* your original */ },
		removeHighlight: async highlightUri => { /* your original */ },
		getArticles: async did => { /* your original */ },
		getArticle: async (did, rkey) => { /* your original */ },
		createArticle: async (title, content) => { /* your original */ },
		updateArticle: async (rkey, title, content) => { /* your original */ },
		deleteArticle: async rkey => { /* your original */ },
		getTrendingTopics: async limit => { /* your original */ },
		getAllPostsForHashtag: async (hashtag, opts) => { /* your original */ },

		getBlobUrl: (did, cid) => `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`,
		getImageUrl: (blobRef, did) => {
			if (typeof blobRef === 'string') return blobRef
			if (!did) return '/placeholder.svg'
			return getBlobUrl(did, blobRef.$link)
		},
		getVideoSourceUrl: (videoBlob, did) => getBlobUrl(did, videoBlob.ref.$link),
	}

	return (
		<BlueskyContext.Provider value={value}>
			{children}
		</BlueskyContext.Provider>
	)
}

export function useBluesky() {
	const context = useContext(BlueskyContext)
	if (!context) throw new Error("useBluesky must be used within BlueskyProvider")
	return context
}
"use client"

import { useState, useCallback } from "react"
import { useBluesky } from "@/lib/bluesky-context"

export function useBlueskyPost(post: any, onPostUpdated?: () => void) {
	const {
		likePost,
		unlikePost,
		repost,
		unrepost,
		editPost,
		deletePost,
		createPost,
		quotePost,
		reportPost,
		pinPost,
		unpinPost,
		addHighlight,
		followUser,
		addBookmark,
		removeBookmark,
		checkIsBookmarked,
		isAuthenticated,
		login,
	} = useBluesky()

	// ── Engagement State ─────────────────────────────────────────────────────
	const [isLiked, setIsLiked] = useState(!!post.viewer?.like)
	const [isReposted, setIsReposted] = useState(!!post.viewer?.repost)
	const [likeCount, setLikeCount] = useState(post.likeCount ?? 0)
	const [repostCount, setRepostCount] = useState(post.repostCount ?? 0)
	const [replyCount, setReplyCount] = useState(post.replyCount ?? 0)

	const [likeUri, setLikeUri] = useState(post.viewer?.like)
	const [repostUri, setRepostUri] = useState(post.viewer?.repost)

	// ── Bookmark State ───────────────────────────────────────────────────────
	const [isBookmarked, setIsBookmarked] = useState(checkIsBookmarked(post.uri))

	// ── Compose / Edit State ─────────────────────────────────────────────────
	const [editText, setEditText] = useState(post.record?.text || "")
	const [replyText, setReplyText] = useState("")
	const [quoteText, setQuoteText] = useState("")

	// ── Report State ─────────────────────────────────────────────────────────
	const [reportReason, setReportReason] = useState("spam")
	const [reportDetails, setReportDetails] = useState("")

	// ── Loading States ───────────────────────────────────────────────────────
	const [loading, setLoading] = useState(false)
	const [isPinning, setIsPinning] = useState(false)
	const [isHighlighting, setIsHighlighting] = useState(false)
	const [isBookmarking, setIsBookmarking] = useState(false)
	const [isFollowLoading, setIsFollowLoading] = useState(false)

	// ── Dialog Visibility ────────────────────────────────────────────────────
	const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
	const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false)
	const [isRepostDialogOpen, setIsRepostDialogOpen] = useState(false)
	const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [isFactCheckOpen, setIsFactCheckOpen] = useState(false)
	const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)

	// ── Helpers ──────────────────────────────────────────────────────────────
	const requireAuth = useCallback((): boolean => {
		if (!isAuthenticated) {
			login()
			return false
		}
		return true
	}, [isAuthenticated, login])

	// ── Core Handlers ────────────────────────────────────────────────────────

	const handleLike = useCallback(async () => {
		if (!requireAuth()) return
		setLoading(true)
		try {
			if (isLiked && likeUri) {
				await unlikePost(likeUri)
				setIsLiked(false)
				setLikeCount((c) => c - 1)
				setLikeUri(undefined)
			} else {
				const newLikeUri = await likePost(post.uri, post.cid)
				setIsLiked(true)
				setLikeCount((c) => c + 1)
				setLikeUri(newLikeUri)
			}
		} catch (error) {
			console.error("Like/unlike failed:", error)
		} finally {
			setLoading(false)
		}
	}, [isLiked, likeUri, post.uri, post.cid, unlikePost, likePost, requireAuth])

	const handleRepost = useCallback(async () => {
		if (!requireAuth()) return
		setLoading(true)
		try {
			if (isReposted && repostUri) {
				await unrepost(repostUri)
				setIsReposted(false)
				setRepostCount((c) => c - 1)
				setRepostUri(undefined)
			} else {
				const newRepostUri = await repost(post.uri, post.cid)
				setIsReposted(true)
				setRepostCount((c) => c + 1)
				setRepostUri(newRepostUri)
			}
			setIsRepostDialogOpen(false)
		} catch (error) {
			console.error("Repost/unrepost failed:", error)
		} finally {
			setLoading(false)
		}
	}, [isReposted, repostUri, post.uri, post.cid, unrepost, repost, requireAuth])

	const handleReply = useCallback(async () => {
		if (!replyText.trim()) return
		setLoading(true)
		try {
			await createPost(replyText, {
				reply: { uri: post.uri, cid: post.cid },
			})
			setReplyText("")
			setReplyCount((c) => c + 1)
			setIsReplyDialogOpen(false)
			onPostUpdated?.()
		} catch (error) {
			console.error("Reply failed:", error)
		} finally {
			setLoading(false)
		}
	}, [replyText, post.uri, post.cid, createPost, onPostUpdated])

	const handleQuote = useCallback(async () => {
		if (!quoteText.trim()) return
		setLoading(true)
		try {
			await quotePost(quoteText, { uri: post.uri, cid: post.cid })
			setQuoteText("")
			setIsQuoteDialogOpen(false)
			onPostUpdated?.()
		} catch (error) {
			console.error("Quote failed:", error)
		} finally {
			setLoading(false)
		}
	}, [quoteText, post.uri, post.cid, quotePost, onPostUpdated])

	const handleReport = useCallback(async () => {
		setLoading(true)
		try {
			const reason = reportDetails ? `${reportReason}: ${reportDetails}` : reportReason
			await reportPost(post.uri, post.cid, reason)
			setReportReason("spam")
			setReportDetails("")
			setIsReportDialogOpen(false)
		} catch (error) {
			console.error("Report failed:", error)
		} finally {
			setLoading(false)
		}
	}, [reportReason, reportDetails, post.uri, post.cid, reportPost])

	const handleDelete = useCallback(async () => {
		setLoading(true)
		try {
			await deletePost(post.uri)
			setIsDeleteDialogOpen(false)
			onPostUpdated?.()
		} catch (error) {
			console.error("Delete failed:", error)
		} finally {
			setLoading(false)
		}
	}, [post.uri, deletePost, onPostUpdated])

	const handlePinToggle = useCallback(async () => {
		if (!requireAuth()) return
		setIsPinning(true)
		try {
			if (isPinned) {
				await unpinPost()
			} else {
				await pinPost(post.uri, post.cid)
			}
			onPostUpdated?.()
		} catch (error) {
			console.error("Pin/unpin failed:", error)
		} finally {
			setIsPinning(false)
		}
	}, [isPinned, post.uri, post.cid, unpinPost, pinPost, requireAuth, onPostUpdated])

	const handleBookmark = useCallback(async () => {
		if (!requireAuth()) return
		setIsBookmarking(true)
		try {
			if (isBookmarked) {
				await removeBookmark(post.uri)
			} else {
				await addBookmark(post.uri)
			}
			setIsBookmarked((prev) => !prev)
		} catch (error) {
			console.error("Bookmark failed:", error)
		} finally {
			setIsBookmarking(false)
		}
	}, [isBookmarked, post.uri, removeBookmark, addBookmark, requireAuth])

	const handleHighlight = useCallback(async () => {
		if (!requireAuth()) return
		setIsHighlighting(true)
		try {
			await addHighlight(post.uri, post.cid)
			onPostUpdated?.()
		} catch (error) {
			console.error("Highlight failed:", error)
		} finally {
			setIsHighlighting(false)
		}
	}, [post.uri, post.cid, addHighlight, requireAuth, onPostUpdated])

	const handleEdit = useCallback(async () => {
		if (!editText.trim()) return
		setLoading(true)
		try {
			await editPost(post.uri, editText)
			setIsEditDialogOpen(false)
			onPostUpdated?.()
		} catch (error) {
			console.error("Edit failed:", error)
		} finally {
			setLoading(false)
		}
	}, [editText, post.uri, editPost, onPostUpdated])

	const handleFollow = useCallback(async () => {
		if (!requireAuth()) return
		setIsFollowLoading(true)
		try {
			await followUser(post.author?.did)
		} catch (error) {
			console.error("Follow failed:", error)
		} finally {
			setIsFollowLoading(false)
		}
	}, [post.author?.did, followUser, requireAuth])

	const handleCopyText = useCallback(() => {
		navigator.clipboard.writeText(post.record?.text || "").catch(() => {})
	}, [post.record?.text])

	const handleShare = useCallback(() => {
		const postUrl = `https://bsky.app/profile/${post.author?.handle}/post/${post.uri.split("/").pop()}`
		navigator.clipboard.writeText(postUrl).catch(() => window.open(postUrl, "_blank"))
	}, [post.author?.handle, post.uri])

	const openOnBluesky = useCallback(() => {
		window.open(`https://bsky.app/profile/${post.author?.handle}/post/${post.uri.split("/").pop()}`, "_blank")
	}, [post.author?.handle, post.uri])

	const handleFactCheck = useCallback(async () => {
		setIsFactCheckOpen(true)
		// Placeholder – implement real fact-check logic if desired
		// e.g. call an API or show a loading state
	}, [])

	// ── Return everything the component needs ────────────────────────────────
	return {
		// State
		isLiked,
		isReposted,
		isBookmarked,
		likeCount,
		repostCount,
		replyCount,
		editText,
		setEditText,
		replyText,
		setReplyText,
		quoteText,
		setQuoteText,
		reportReason,
		setReportReason,
		reportDetails,
		setReportDetails,
		loading,
		isPinning,
		isHighlighting,
		isBookmarking,
		isFollowLoading,

		// Dialogs
		isReplyDialogOpen,
		setIsReplyDialogOpen,
		isQuoteDialogOpen,
		setIsQuoteDialogOpen,
		isRepostDialogOpen,
		setIsRepostDialogOpen,
		isReportDialogOpen,
		setIsReportDialogOpen,
		isEditDialogOpen,
		setIsEditDialogOpen,
		isDeleteDialogOpen,
		setIsDeleteDialogOpen,
		isFactCheckOpen,
		setIsFactCheckOpen,
		isAnalyticsOpen,
		setIsAnalyticsOpen,

		// Actions / Handlers
		handleLike,
		handleRepost,
		handleReply,
		handleQuote,
		handleReport,
		handleDelete,
		handlePinToggle,
		handleBookmark,
		handleHighlight,
		handleEdit,
		handleFollow,
		handleCopyText,
		handleShare,
		openOnBluesky,
		handleFactCheck,
	}
}
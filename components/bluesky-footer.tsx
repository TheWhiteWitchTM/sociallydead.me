"use client"

import { useState } from "react"
import { MessageCircle, Repeat2, Heart, Bookmark, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog"
import { ComposeInput } from "@/components/compose-input"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useBluesky } from "@/lib/bluesky-context"
import { cn } from "@/lib/utils"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {HandleLink} from "@/components/handle-link";

function formatEngagement(count: number): string {
	if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
	if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
	return count.toString()
}

interface BlueskyFooterProps {
	post: any
	replyCount: number
	repostCount: number
	likeCount: number
	isLiked: boolean
	isReposted: boolean
	isBookmarked: boolean
	onLike: () => void
	onRepostClick: () => void
	onReplyClick: () => void
	onBookmark: () => void
	onAnalyticsClick: () => void
}

export function BlueskyFooter({
	                              post,
	                              replyCount,
	                              repostCount,
	                              likeCount,
	                              isLiked,
	                              isReposted,
	                              isBookmarked,
	                              onLike,
	                              onRepostClick,
	                              onReplyClick,
	                              onBookmark,
	                              onAnalyticsClick,
                              }: BlueskyFooterProps) {
	const { isAuthenticated, login } = useBluesky()

	const [isReplyOpen, setIsReplyOpen] = useState(false)
	const [isQuoteOpen, setIsQuoteOpen] = useState(false)
	const [isRepostOpen, setIsRepostOpen] = useState(false)
	const [isReportOpen, setIsReportOpen] = useState(false)
	const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)

	const [replyText, setReplyText] = useState("")
	const [quoteText, setQuoteText] = useState("")
	const [reportReason, setReportReason] = useState("spam")
	const [reportDetails, setReportDetails] = useState("")
	const [isLoading, setIsLoading] = useState(false)

	const requireAuth = (action: () => void) => {
		if (!isAuthenticated) {
			login()
		} else {
			action()
		}
	}

	const handleReply = () => {
		// Your reply logic here (call createPost etc.)
		// For now just close dialog as placeholder
		setIsReplyOpen(false)
		setReplyText("")
	}

	const handleQuote = () => {
		// Your quote logic here
		setIsQuoteOpen(false)
		setQuoteText("")
	}

	const handleRepost = () => {
		// Your repost logic here
		setIsRepostOpen(false)
	}

	const handleReport = () => {
		// Your report logic here
		setIsReportOpen(false)
		setReportReason("spam")
		setReportDetails("")
	}

	return (
		<>
			<div className="flex items-center -ml-2 mt-2 text-muted-foreground">
				<Button
					variant="ghost"
					size="sm"
					className="gap-1 px-2 hover:text-blue-500 hover:bg-blue-500/10"
					onClick={() => requireAuth(onReplyClick)}
					disabled={!isAuthenticated}
				>
					<MessageCircle className="h-4 w-4" />
					<span className="text-xs sm:text-sm tabular-nums">{replyCount}</span>
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className={cn(
						"gap-1 px-2 hover:text-green-500 hover:bg-green-500/10",
						isReposted && "text-green-500"
					)}
					onClick={() => requireAuth(onRepostClick)}
					disabled={!isAuthenticated}
				>
					<Repeat2 className="h-4 w-4" />
					<span className="text-xs sm:text-sm tabular-nums">{repostCount}</span>
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className={cn(
						"gap-1 px-2 hover:text-red-500 hover:bg-red-500/10",
						isLiked && "text-red-500"
					)}
					onClick={() => requireAuth(onLike)}
					disabled={!isAuthenticated}
				>
					<Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
					<span className="text-xs sm:text-sm tabular-nums">{likeCount}</span>
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className={cn(
						"gap-1 px-2 hover:text-blue-500 hover:bg-blue-500/10",
						isBookmarked && "text-blue-500"
					)}
					onClick={() => requireAuth(onBookmark)}
					disabled={!isAuthenticated}
					title={isBookmarked ? "Remove bookmark" : "Bookmark"}
				>
					<Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
				</Button>

				{(replyCount + repostCount + likeCount) > 0 && (
					<Button
						variant="ghost"
						size="sm"
						className="gap-1 px-2 ml-auto hover:text-blue-500 hover:bg-blue-500/10"
						onClick={onAnalyticsClick}
					>
						<BarChart3 className="h-3.5 w-3.5" />
						<span className="text-xs tabular-nums">
              {formatEngagement(replyCount + repostCount + likeCount)}
            </span>
					</Button>
				)}
			</div>

			{/* Reply Dialog */}
			<Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
				<DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Reply to Post</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="p-3 rounded-lg bg-muted/50">
							<div className="flex items-center gap-2 mb-2">
								<Avatar className="h-6 w-6">
									<AvatarImage src={post.author?.avatar || "/placeholder.svg"} />
									<AvatarFallback className="text-xs">
										{(post.author?.displayName || post.author?.handle).slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<span className="font-medium text-sm">{post.author?.displayName || post.author?.handle}</span>
								<HandleLink handle={post.author?.handle} className="text-sm" />
							</div>
							<p className="text-sm text-muted-foreground line-clamp-3">{post.record.text}</p>
						</div>

						<ComposeInput
							postType="reply"
							text={replyText}
							onTextChange={setReplyText}
							placeholder="Write your reply..."
							minHeight="min-h-24"
							onCancel={() => setIsReplyOpen(false)}
							onSubmit={handleReply}
							compact
							autoFocus
						/>
					</div>
				</DialogContent>
			</Dialog>

			{/* Quote Dialog */}
			<Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
				<DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Quote Post</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<ComposeInput
							postType="quote"
							text={quoteText}
							onTextChange={setQuoteText}
							placeholder="Add your thoughts..."
							minHeight="min-h-24"
							onCancel={() => setIsQuoteOpen(false)}
							onSubmit={handleQuote}
							compact
							autoFocus
						/>

						<div className="border rounded-lg p-3 bg-muted/30">
							<MarkdownRenderer content={post.record.text} />
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Repost Dialog */}
			<Dialog open={isRepostOpen} onOpenChange={setIsRepostOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Repost</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-2">
						<Button variant="outline" onClick={handleRepost}>
							{isReposted ? "Undo Repost" : "Repost"}
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								setIsRepostOpen(false)
								setIsQuoteOpen(true)
							}}
						>
							Quote Post
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Report Dialog */}
			<Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Report Post</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<RadioGroup value={reportReason} onValueChange={setReportReason}>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="spam" id="spam" />
								<Label htmlFor="spam">Spam or misleading</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="abuse" id="abuse" />
								<Label htmlFor="abuse">Harassment or abuse</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="hate" id="hate" />
								<Label htmlFor="hate">Hate speech</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="violence" id="violence" />
								<Label htmlFor="violence">Violence or threats</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="other" id="other" />
								<Label htmlFor="other">Other</Label>
							</div>
						</RadioGroup>

						<div>
							<Label htmlFor="details">Additional details (optional)</Label>
							<Textarea
								id="details"
								value={reportDetails}
								onChange={(e) => setReportDetails(e.target.value)}
								className="mt-1"
								placeholder="Provide more context..."
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsReportOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleReport} disabled={isLoading}>
							{isLoading ? "Reporting..." : "Submit Report"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Analytics Dialog */}
			<Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<BarChart3 className="h-5 w-5" />
							Post Analytics
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="grid grid-cols-1 gap-3">
							<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
								<div className="flex items-center gap-2.5">
									<div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500/10">
										<MessageCircle className="h-4 w-4 text-blue-500" />
									</div>
									<span className="text-sm font-medium">Replies</span>
								</div>
								<span className="text-lg font-bold tabular-nums">{replyCount.toLocaleString()}</span>
							</div>

							<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
								<div className="flex items-center gap-2.5">
									<div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500/10">
										<Repeat2 className="h-4 w-4 text-green-500" />
									</div>
									<span className="text-sm font-medium">Reposts</span>
								</div>
								<span className="text-lg font-bold tabular-nums">{repostCount.toLocaleString()}</span>
							</div>

							<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
								<div className="flex items-center gap-2.5">
									<div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-500/10">
										<Heart className="h-4 w-4 text-red-500" />
									</div>
									<span className="text-sm font-medium">Likes</span>
								</div>
								<span className="text-lg font-bold tabular-nums">{likeCount.toLocaleString()}</span>
							</div>

							<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
								<div className="flex items-center gap-2.5">
									<div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-500/10">
										<BarChart3 className="h-4 w-4 text-purple-500" />
									</div>
									<span className="text-sm font-medium">Total Engagements</span>
								</div>
								<span className="text-lg font-bold tabular-nums">
                  {(replyCount + repostCount + likeCount).toLocaleString()}
                </span>
							</div>
						</div>

						{(replyCount + repostCount + likeCount) > 0 && (
							<div className="space-y-2">
								<p className="text-xs font-medium text-muted-foreground">Engagement Breakdown</p>
								<div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
									{replyCount > 0 && (
										<div
											className="h-full bg-blue-500 transition-all"
											style={{ width: `${(replyCount / (replyCount + repostCount + likeCount)) * 100}%` }}
										/>
									)}
									{repostCount > 0 && (
										<div
											className="h-full bg-green-500 transition-all"
											style={{ width: `${(repostCount / (replyCount + repostCount + likeCount)) * 100}%` }}
										/>
									)}
									{likeCount > 0 && (
										<div
											className="h-full bg-red-500 transition-all"
											style={{ width: `${(likeCount / (replyCount + repostCount + likeCount)) * 100}%` }}
										/>
									)}
								</div>
								<div className="flex justify-between text-xs text-muted-foreground">
									<div className="flex items-center gap-1">
										<span className="h-2 w-2 rounded-full bg-blue-500" /> Replies
									</div>
									<div className="flex items-center gap-1">
										<span className="h-2 w-2 rounded-full bg-green-500" /> Reposts
									</div>
									<div className="flex items-center gap-1">
										<span className="h-2 w-2 rounded-full bg-red-500" /> Likes
									</div>
								</div>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
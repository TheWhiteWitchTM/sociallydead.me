"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { formatDistanceToNow } from "date-fns"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { ComposeInput } from "@/components/compose-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Loader2, RefreshCw, ArrowLeft, PenSquare, MessageSquare,
  MoreVertical, Trash2, BellOff, Bell, Ban, LogOut, X
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { VerifiedBadge } from "@/components/verified-badge"
import { HandleLink } from "@/components/handle-link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {UserHoverCard} from "@/components/user-hover-card";
import Link from "next/link";

interface Convo {
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

interface Message {
  id: string
  rev: string
  text: string
  sender: { did: string }
  sentAt: string
}

// Helper: check if a member handle is invalid/deleted
function isInvalidHandle(handle: string): boolean {
  return !handle || handle.endsWith(".invalid") || handle === "handle.invalid" || handle === "invalid.handle"
}

// Helper: get display name for a member, handling deleted accounts
function getMemberDisplayName(member: { handle: string; displayName?: string }): string {
  if (isInvalidHandle(member.handle)) return "Deleted Account"
  return member.displayName || member.handle
}

export default function MessagesPage() {
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    user,
    getConversations, 
    getMessages, 
    sendMessage,
    startConversation,
    markConvoRead,
    leaveConvo,
    muteConvo,
    unmuteConvo,
    blockUser,
    unblockUser,
    getProfile,
    searchActors,
    logout,
  } = useBluesky()
  
  const [conversations, setConversations] = useState<Convo[]>([])
  const [selectedConvo, setSelectedConvo] = useState<Convo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [newConvoOpen, setNewConvoOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ did: string; handle: string; displayName?: string; avatar?: string }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [needsReauth, setNeedsReauth] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [convoToDelete, setConvoToDelete] = useState<Convo | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setNeedsReauth(false)
    
    try {
      const convos = await getConversations()
      setConversations(convos)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      if (errMsg.includes('cope') || errMsg.includes('Missing') || errMsg.includes('403')) {
        setNeedsReauth(true)
      } else {
        setError(errMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }, [getConversations])

  const loadMessages = useCallback(async (convoId: string) => {
    setMessagesLoading(true)
    try {
      const result = await getMessages(convoId)
      setMessages(result.messages.reverse())
    } catch (err) {
      console.error("Failed to load messages:", err)
    } finally {
      setMessagesLoading(false)
    }
  }, [getMessages])

  const handleSendMessage = async () => {
    if (!selectedConvo || !newMessage.trim()) return
    
    setIsSending(true)
    try {
      const sentMessage = await sendMessage(selectedConvo.id, newMessage)
      setMessages((prev) => [...prev, sentMessage])
      setNewMessage("")
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleSelectConvo = (convo: Convo) => {
    setSelectedConvo(convo)
    loadMessages(convo.id)
    markConvoRead(convo.id)
    setConversations(prev => 
      prev.map(c => c.id === convo.id ? { ...c, unreadCount: 0 } : c)
    )
  }

  const handleBackToList = () => {
    setSelectedConvo(null)
    setMessages([])
  }

  const handleCloseChat = () => {
    setSelectedConvo(null)
    setMessages([])
  }

  const handleLeaveConvo = async () => {
    if (!selectedConvo) return
    setActionLoading(true)
    try {
      await leaveConvo(selectedConvo.id)
      setConversations(prev => prev.filter(c => c.id !== selectedConvo.id))
      setSelectedConvo(null)
      setMessages([])
      setShowLeaveDialog(false)
    } catch (error) {
      console.error("Failed to leave conversation:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMuteConvo = async () => {
    if (!selectedConvo) return
    setActionLoading(true)
    try {
      if (selectedConvo.muted) {
        await unmuteConvo(selectedConvo.id)
        setSelectedConvo(prev => prev ? { ...prev, muted: false } : null)
        setConversations(prev => prev.map(c => c.id === selectedConvo.id ? { ...c, muted: false } : c))
      } else {
        await muteConvo(selectedConvo.id)
        setSelectedConvo(prev => prev ? { ...prev, muted: true } : null)
        setConversations(prev => prev.map(c => c.id === selectedConvo.id ? { ...c, muted: true } : c))
      }
    } catch (error) {
      console.error("Failed to mute/unmute conversation:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMuteFromList = async (convo: Convo) => {
    try {
      if (convo.muted) {
        await unmuteConvo(convo.id)
        setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, muted: false } : c))
        if (selectedConvo?.id === convo.id) setSelectedConvo(prev => prev ? { ...prev, muted: false } : null)
      } else {
        await muteConvo(convo.id)
        setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, muted: true } : c))
        if (selectedConvo?.id === convo.id) setSelectedConvo(prev => prev ? { ...prev, muted: true } : null)
      }
    } catch (error) {
      console.error("Failed to mute/unmute:", error)
    }
  }

  const handleDeleteFromList = async () => {
    const convo = convoToDelete
    if (!convo) return
    setActionLoading(true)
    try {
      await leaveConvo(convo.id)
      setConversations(prev => prev.filter(c => c.id !== convo.id))
      if (selectedConvo?.id === convo.id) {
        setSelectedConvo(null)
        setMessages([])
      }
      setShowDeleteDialog(false)
      setConvoToDelete(null)
    } catch (error) {
      console.error("Failed to remove conversation:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBlockUser = async () => {
    if (!selectedConvo) return
    const otherMember = selectedConvo.members.find(m => m.did !== user?.did)
    if (!otherMember) return
    
    setActionLoading(true)
    try {
      const profile = await getProfile(otherMember.handle)
      if (profile.viewer?.blocking) {
        await unblockUser(profile.viewer.blocking)
      } else {
        await blockUser(otherMember.did)
      }
      setShowBlockDialog(false)
      await loadConversations()
      setSelectedConvo(null)
      setMessages([])
    } catch (error) {
      console.error("Failed to block/unblock user:", error)
    } finally {
      setActionLoading(false)
    }
  }

  // Poll for new messages in active conversation
  useEffect(() => {
    if (!selectedConvo) return
    
    const pollMessages = async () => {
      try {
        const result = await getMessages(selectedConvo.id)
        const newMsgs = result.messages.reverse()
        setMessages(prev => {
          if (newMsgs.length !== prev.length || 
              (newMsgs.length > 0 && prev.length > 0 && newMsgs[newMsgs.length - 1].id !== prev[prev.length - 1].id)) {
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
            return newMsgs
          }
          return prev
        })
      } catch {
        // Silently fail polling
      }
    }
    
    const interval = setInterval(pollMessages, 5000)
    return () => clearInterval(interval)
  }, [selectedConvo, getMessages])

  // Poll conversation list
  useEffect(() => {
    if (!isAuthenticated) return
    
    const pollConvos = async () => {
      try {
        const convos = await getConversations()
        setConversations(prev => {
          return convos.map(c => {
            if (selectedConvo && c.id === selectedConvo.id) {
              return { ...c, unreadCount: 0 }
            }
            return c
          })
        })
      } catch {
        // Silently fail
      }
    }
    
    const interval = setInterval(pollConvos, 15000)
    return () => clearInterval(interval)
  }, [isAuthenticated, getConversations, selectedConvo])

  // Debounced search for new conversation
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    
    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      try {
        const result = await searchActors(searchQuery)
        setSearchResults(result.actors.slice(0, 8))
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setIsSearching(false)
      }
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchActors])

  const handleStartConvo = async (did: string) => {
    try {
      const convo = await startConversation(did)
      setNewConvoOpen(false)
      setSearchQuery("")
      setSearchResults([])
      await loadConversations()
      handleSelectConvo(convo)
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      if (errMsg.includes('cope') || errMsg.includes('403')) {
        setError("Chat permissions missing. Please use the 'Log out and re-authenticate' button below to fix this.")
      } else {
        setError(`Failed to start conversation: ${errMsg}`)
      }
      setNewConvoOpen(false)
    }
  }

  // Reset to list on mount
  useEffect(() => {
    setSelectedConvo(null)
    setMessages([])
    
    if (isAuthenticated) loadConversations()
    
    const handleNavClick = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail === '/messages') {
        setSelectedConvo(null)
        setMessages([])
        if (isAuthenticated) loadConversations()
      }
    }
    window.addEventListener('nav-click', handleNavClick)
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) loadConversations()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('nav-click', handleNavClick)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    // Only auto-scroll if we just loaded or sent a message
    // Don't scroll if messages are being loaded for the first time (prevents animation)
    if (messages.length > 0 && !messagesLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  }, [messages, messagesLoading])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPrompt title="Messages" description="Sign in to view your messages" />
  }

  // Sorted & filtered conversations (filter out convos where all other members are deleted)
  const sortedConversations = [...conversations]
    .filter((convo) => {
      const otherMembers = convo.members.filter(m => m.did !== user?.did)
      // Keep convo if at least one other member has a valid handle
      return otherMembers.some(m => !isInvalidHandle(m.handle))
    })
    .sort((a, b) => {
      const aUnread = a.unreadCount > 0 && a.lastMessage?.sender.did !== user?.did
      const bUnread = b.unreadCount > 0 && b.lastMessage?.sender.did !== user?.did
      if (aUnread && !bUnread) return -1
      if (!aUnread && bUnread) return 1
      const aTime = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0
      const bTime = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0
      return bTime - aTime
    })

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          {selectedConvo ? (
            <>
              <div className="flex items-center gap-3">
                <Button onClick={handleBackToList} variant="ghost" size="icon" className="lg:hidden">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  {selectedConvo.members.filter(m => m.did !== user?.did).map((member) => (
                    <div key={member.did} className="flex items-center gap-2">
                      <div className="relative">
                        <UserHoverCard handle={member.handle}>
                          <div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                            {getMemberDisplayName(member).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                            </Avatar>
                          <VerifiedBadge
                            handle={member.handle} 
                            did={member.did}
                            className="absolute -right-1 -bottom-1 scale-50 origin-bottom-right bg-background rounded-full" 
                          />
                          </div>
                        </UserHoverCard>
                      </div>
                      <span className="font-semibold truncate max-w-[150px] sm:max-w-none">
                        <UserHoverCard handle={member.handle}>
                          <Link href={`/profile/${member.handle}`} className="hover:underline">
                            {getMemberDisplayName(member)}
                          </Link>
                        </UserHoverCard>
                      </span>
                      {!isInvalidHandle(member.handle) && <VerifiedBadge handle={member.handle} did={member.did} />}
                      {selectedConvo.muted && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Muted</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button onClick={() => loadMessages(selectedConvo.id)} variant="ghost" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCloseChat}>
                      <X className="mr-2 h-4 w-4" />
                      Close Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMuteConvo} disabled={actionLoading}>
                      {selectedConvo.muted ? (
                        <><Bell className="mr-2 h-4 w-4" />Unmute Notifications</>
                      ) : (
                        <><BellOff className="mr-2 h-4 w-4" />Mute Notifications</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowLeaveDialog(true)} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Leave Conversation
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowBlockDialog(true)} className="text-destructive">
                      <Ban className="mr-2 h-4 w-4" />
                      Block User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <h1 className="text-xl font-bold">Messages</h1>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={newConvoOpen} onOpenChange={setNewConvoOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <PenSquare className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Message</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Input
                          placeholder="Search by handle (e.g. @username)"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Start typing to search for users...
                      </p>
                      {searchResults.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {searchResults.map((actor) => (
                            <button
                              key={actor.did} 
                              type="button"
                              className="w-full text-left cursor-pointer hover:bg-accent transition-colors rounded-lg border p-3"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleStartConvo(actor.did)
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={actor.avatar || "/placeholder.svg"} />
                                    <AvatarFallback>
                                      {(actor.displayName || actor.handle).slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <VerifiedBadge 
                                    handle={actor.handle} 
                                    did={actor.did}
                                    className="absolute -right-1 -bottom-1 scale-50 origin-bottom-right bg-background rounded-full" 
                                  />
                                </div>
                                <UserHoverCard handle={actor.handle}>
                                  <Link href={`/profile/${actor.handle}`} className="font-semibold flex items-center gap-1 hover:underline">
                                    {actor.displayName || actor.handle} <VerifiedBadge handle={actor.handle} did={actor.did} />
                                  </Link>
                                </UserHoverCard>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : searchQuery.length >= 2 && !isSearching ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No users found for &quot;{searchQuery}&quot;
                        </p>
                      ) : null}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button onClick={loadConversations} variant="ghost" size="icon" disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-2 sm:px-4 py-6">
        <div className="flex gap-4">
          {/* Conversation List */}
          <div className={`w-full lg:w-80 lg:border-r lg:pr-4 ${selectedConvo ? 'hidden lg:block' : ''}`}>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : needsReauth ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-muted-foreground text-sm text-center">
                  Chat permissions are missing from your current session.
                </p>
                <Button variant="default" onClick={logout}>
                  Log out and re-authenticate
                </Button>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-muted-foreground text-sm text-center">{error}</p>
                <Button onClick={loadConversations} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg max-w-sm">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    Getting permission errors?
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Log out and log back in to grant chat permissions.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={logout}>
                    Log out and re-authenticate
                  </Button>
                </div>
              </div>
            ) : sortedConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start a conversation with someone!
                </p>
                <Button onClick={() => setNewConvoOpen(true)} className="mt-4">
                  <PenSquare className="mr-2 h-4 w-4" />
                  New Message
                </Button>
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg max-w-sm">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    Not seeing your DMs?
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    If you logged in before chat was enabled, you may need to log out and log back in to grant chat permissions.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={logout}>
                    Log out and re-authenticate
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedConversations.map((convo) => {
                  const otherMembers = convo.members.filter(m => m.did !== user?.did)
                  const validMembers = otherMembers.filter(m => !isInvalidHandle(m.handle))
                  const isSelected = selectedConvo?.id === convo.id
                  const lastMsgFromOther = convo.lastMessage && convo.lastMessage.sender.did !== user?.did
                  const hasUnread = convo.unreadCount > 0 && !!lastMsgFromOther && validMembers.length > 0
                  
                  return (
                    <Card 
                      key={convo.id}
                      className={`cursor-pointer transition-colors relative group ${isSelected ? 'bg-accent' : 'hover:bg-accent/50'}`}
                      onClick={() => handleSelectConvo(convo)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={validMembers[0]?.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {getMemberDisplayName(validMembers[0] || otherMembers[0]).slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {validMembers[0] && (
                              <VerifiedBadge 
                                handle={validMembers[0].handle} 
                                did={validMembers[0].did}
                                className="absolute -right-0 -bottom-0 scale-75 origin-bottom-right bg-background rounded-full" 
                              />
                            )}
                            {hasUnread && (
                              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                {convo.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className={`truncate ${hasUnread ? 'font-bold' : 'font-semibold'}`}>
                                {validMembers.map(m => getMemberDisplayName(m)).join(", ") || "Deleted Account"}
                              </p>
                              {validMembers.map(m => (
                                <VerifiedBadge key={m.did} handle={m.handle} did={m.did} className="shrink-0" />
                              ))}
                              {convo.muted && (
                                <BellOff className="h-3 w-3 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            {convo.lastMessage && (
                              <p className={`text-sm truncate ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                {convo.lastMessage.text}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {convo.lastMessage && (
                              <span className={`text-xs ${hasUnread ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                {formatDistanceToNow(new Date(convo.lastMessage.sentAt), { addSuffix: false })}
                              </span>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  handleMuteFromList(convo)
                                }}>
                                  {convo.muted ? (
                                    <><Bell className="mr-2 h-4 w-4" />Unmute</>
                                  ) : (
                                    <><BellOff className="mr-2 h-4 w-4" />Mute</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setConvoToDelete(convo)
                                    setShowDeleteDialog(true)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove Conversation
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Message View */}
          <div className={`flex-1 ${!selectedConvo ? 'hidden lg:flex lg:items-center lg:justify-center' : ''}`}>
            {!selectedConvo ? (
              <p className="text-muted-foreground">Select a conversation to view messages</p>
            ) : (
              <div className="flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}>
                {/* Messages - scrollable area */}
                <div className="flex-1 overflow-y-auto min-h-0 px-1">
                  {messagesLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-2">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      {messages.map((message) => {
                        const isOwn = message.sender.did === user?.did
                        const sender = selectedConvo.members.find(m => m.did === message.sender.did)
                        
                        return (
                          <div 
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                              {!isOwn && (
                                <UserHoverCard handle={sender.handle}>
                                  <Link href={`/profile/${sender.handle}`} className="relative mt-1 shrink-0 block">
                                    <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                                      <AvatarImage src={sender?.avatar || "/placeholder.svg"} />
                                      <AvatarFallback className="text-xs">
                                        {getMemberDisplayName(sender || { handle: "", displayName: "?" }).slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {sender?.handle && (
                                      <VerifiedBadge 
                                        handle={sender.handle} 
                                        did={sender.did}
                                        className="absolute -right-1 -bottom-1 scale-50 origin-bottom-right bg-background rounded-full" 
                                      />
                                    )}
                                  </Link>
                                </UserHoverCard>
                              )}
                              <div>
                                <div 
                                  className={`rounded-2xl px-4 py-2 ${
                                    isOwn 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted'
                                  }`}
                                >
                                  <MarkdownRenderer 
                                    content={message.text} 
                                    className={`text-sm [&_p]:leading-relaxed ${isOwn ? '[&_*]:text-primary-foreground [&_a]:text-primary-foreground [&_a]:underline' : ''}`}
                                  />
                                </div>
                                <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right' : ''}`}>
                                  {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Chat Composer - pinned to bottom */}
                <div className="shrink-0 border-t border-border bg-background pt-3 pb-2">
                  <ComposeInput
                    text={newMessage}
                    onTextChange={setNewMessage}
                    onSubmit={handleSendMessage}
                    isSubmitting={isSending}
                    placeholder="Type a message... (Markdown supported, Shift+Enter to send)"
                    postType="dm"
                    showSubmitButton={true}
                    submitButtonText="Send"
                    minHeight="min-h-[60px]"
                    compact={true}
                    autoFocus={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Remove Conversation from List Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              {convoToDelete && (() => {
                const otherMember = convoToDelete.members.find(m => m.did !== user?.did)
                return `Remove your conversation with ${getMemberDisplayName(otherMember || { handle: "", displayName: "this user" })}? This will leave the conversation and it will no longer appear in your messages.`
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFromList} 
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Removing...</>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Conversation Confirmation */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this conversation? You will no longer see messages from this chat. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLeaveConvo} 
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Leaving...</>
              ) : (
                "Leave Conversation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block User Confirmation */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedConvo && (() => {
                const otherMember = selectedConvo.members.find(m => m.did !== user?.did)
                return `Are you sure you want to block ${getMemberDisplayName(otherMember || { handle: "", displayName: "this user" })}? They won't be able to message you or see your posts.`
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBlockUser} 
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Blocking...</>
              ) : (
                "Block User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

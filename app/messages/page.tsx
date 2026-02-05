"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { formatDistanceToNow } from "date-fns"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, RefreshCw, Send, ArrowLeft, PenSquare } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

export default function MessagesPage() {
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    user,
    getConversations, 
    getMessages, 
    sendMessage,
    startConversation,
    searchActors,
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log("[v0] Loading conversations...")
      const convos = await getConversations()
      console.log("[v0] Conversations loaded:", convos)
      setConversations(convos)
    } catch (err) {
      console.error("[v0] Failed to load conversations:", err)
      setError(err instanceof Error ? err.message : "Failed to load conversations")
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
  }

  const handleBackToList = () => {
    setSelectedConvo(null)
    setMessages([])
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const result = await searchActors(searchQuery)
      setSearchResults(result.actors)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleStartConvo = async (did: string) => {
    try {
      const convo = await startConversation(did)
      setNewConvoOpen(false)
      setSearchQuery("")
      setSearchResults([])
      await loadConversations()
      handleSelectConvo(convo)
    } catch (error) {
      console.error("Failed to start conversation:", error)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations()
    }
  }, [isAuthenticated, loadConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  // Mobile: Show conversation list or selected conversation
  // Desktop: Show both side by side
  
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
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {(member.displayName || member.handle).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">{member.displayName || member.handle}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => loadMessages(selectedConvo.id)} variant="ghost" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold">Messages</h1>
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
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search for a user..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isSearching}>
                          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                        </Button>
                      </div>
                      {searchResults.length > 0 && (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {searchResults.map((actor) => (
                            <Card 
                              key={actor.did} 
                              className="cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => handleStartConvo(actor.did)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={actor.avatar || "/placeholder.svg"} />
                                    <AvatarFallback>
                                      {(actor.displayName || actor.handle).slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold">{actor.displayName || actor.handle}</p>
                                    <p className="text-sm text-muted-foreground">@{actor.handle}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
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
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-muted-foreground text-sm">{error}</p>
                <Button onClick={loadConversations} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start a conversation with someone!
                </p>
                <Button onClick={() => setNewConvoOpen(true)} className="mt-4">
                  <PenSquare className="mr-2 h-4 w-4" />
                  New Message
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((convo) => {
                  const otherMembers = convo.members.filter(m => m.did !== user?.did)
                  const isSelected = selectedConvo?.id === convo.id
                  
                  return (
                    <Card 
                      key={convo.id}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-accent' : 'hover:bg-accent/50'}`}
                      onClick={() => handleSelectConvo(convo)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={otherMembers[0]?.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {(otherMembers[0]?.displayName || otherMembers[0]?.handle || "?").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {convo.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                {convo.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {otherMembers.map(m => m.displayName || m.handle).join(", ")}
                            </p>
                            {convo.lastMessage && (
                              <p className="text-sm text-muted-foreground truncate">
                                {convo.lastMessage.text}
                              </p>
                            )}
                          </div>
                          {convo.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(convo.lastMessage.sentAt), { addSuffix: false })}
                            </span>
                          )}
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
              <div className="flex flex-col h-[calc(100vh-12rem)]">
                {/* Messages */}
                <ScrollArea className="flex-1 pr-4">
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
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarImage src={sender?.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">
                                    {(sender?.displayName || sender?.handle || "?").slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div>
                                <div 
                                  className={`rounded-2xl px-4 py-2 ${
                                    isOwn 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted'
                                  }`}
                                >
                                  <p className="text-sm">{message.text}</p>
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
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      disabled={isSending}
                    />
                    <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

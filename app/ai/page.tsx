"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useBluesky } from "@/lib/bluesky-context"
import { SignInPrompt } from "@/components/sign-in-prompt"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Loader2, Sparkles, Send, Copy, RotateCcw } from "lucide-react"

const AI_ACTIONS = [
  { value: "improve", label: "Improve Writing", prompt: "Improve this text for a social media post. Make it more engaging while keeping it concise:" },
  { value: "shorten", label: "Make Shorter", prompt: "Shorten this text to fit in a tweet/post (under 280 characters) while preserving the main message:" },
  { value: "expand", label: "Expand Ideas", prompt: "Expand on this text with more detail, but keep it suitable for a social media post:" },
  { value: "casual", label: "Make Casual", prompt: "Rewrite this text in a more casual, friendly tone for social media:" },
  { value: "professional", label: "Make Professional", prompt: "Rewrite this text in a more professional tone:" },
  { value: "generate", label: "Generate Post", prompt: "Generate an engaging social media post about:" },
  { value: "hashtags", label: "Add Hashtags", prompt: "Add relevant hashtags to this post:" },
  { value: "thread", label: "Create Thread", prompt: "Break this content into a numbered thread of posts (each under 280 chars):" },
]

export default function AIPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, createPost } = useBluesky()
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [action, setAction] = useState("improve")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  const handleGenerate = async () => {
    if (!input.trim()) return

    setIsProcessing(true)
    setOutput("")

    const selectedAction = AI_ACTIONS.find((a) => a.value === action)
    const prompt = `${selectedAction?.prompt}\n\n"${input}"\n\nRespond with only the improved text, no explanations.`

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) throw new Error("Failed to generate")

      const data = await response.json()
      setOutput(data.text)
    } catch (error) {
      console.error("AI generation failed:", error)
      setOutput("Failed to generate. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
  }

  const handlePostDirectly = async () => {
    if (!output.trim()) return

    setIsPosting(true)
    try {
      await createPost(output)
      router.push("/")
    } catch (error) {
      console.error("Failed to post:", error)
    } finally {
      setIsPosting(false)
    }
  }

  const handleUseInComposer = () => {
    // Store in sessionStorage and redirect to compose
    sessionStorage.setItem("compose_draft", output)
    router.push("/compose")
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInPrompt title="AI Assistant" description="Sign in to use the AI-powered post assistant" />
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <Sparkles className="mr-2 h-5 w-5" />
          <h1 className="text-xl font-bold">AI Assistant</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Post Assistant</CardTitle>
            <CardDescription>
              Let AI help you craft the perfect post
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action">What would you like to do?</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_ACTIONS.map((act) => (
                    <SelectItem key={act.value} value={act.value}>
                      {act.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="input">Your text or idea</Label>
              <Textarea
                id="input"
                placeholder="Enter your text or idea here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-32"
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isProcessing || !input.trim()}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {output && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Generated Result</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleGenerate} title="Regenerate">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <MarkdownRenderer content={output} />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handlePostDirectly} 
                  disabled={isPosting}
                  className="flex-1"
                >
                  {isPosting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Post Now
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleUseInComposer}
                  className="flex-1 bg-transparent"
                >
                  Edit in Composer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

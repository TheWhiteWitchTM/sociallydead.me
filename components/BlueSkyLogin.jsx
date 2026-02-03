// components/BlueSkyLogin.jsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

export default function BlueSkyLogin({ className = '' }) {
  const [handle, setHandle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const signIn = async () => {
    setError('')
    setLoading(true)

    if (!handle.trim()) {
      setError('Enter your Bluesky handle first')
      setLoading(false)
      return
    }

    // Quick check if handle looks valid (basic)
    if (handle.length < 3 || !handle.includes('.')) {
      setError('Handle should look like username.bsky.social')
      setLoading(false)
      return
    }

    // Open Bluesky in NEW TAB (your site stays)
    window.open('https://bsky.app', '_blank', 'noopener,noreferrer')

    setLoading(false)
  }

  return (
    <div className={`w-40 flex flex-col gap-3 ${className}`}>
      <Input
        placeholder="Your Bluesky handle"
        value={handle}
        onChange={e => {
          setHandle(e.target.value)
          setError('')
        }}
        className="h-8 text-sm"
        disabled={loading}
      />

      {error && (
        <Alert variant="destructive" className="py-2 text-xs">
          <AlertCircle className="h-3 w-3" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        size="sm"
        className="w-full"
        onClick={signIn}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opening...
          </>
        ) : (
          'Sign in with Bluesky'
        )}
      </Button>

      <p className="text-[10px] text-muted-foreground text-center mt-1 leading-tight">
        Opens Bluesky login in new tab — your site stays open
      </p>
    </div>
  )
}
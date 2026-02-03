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
      setError('Enter your Bluesky handle')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/bluesky-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Sign-in failed')
        setLoading(false)
        return
      }

      // Valid → redirect to Bluesky login
      window.location.href = data.authUrl
    } catch (err) {
      setError('Network error — try again')
      setLoading(false)
    }
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
            Checking...
          </>
        ) : (
          'Sign in with Bluesky'
        )}
      </Button>

      <p className="text-[10px] text-muted-foreground text-center mt-1">
        Validates handle first — then opens Bluesky login
      </p>
    </div>
  )
}
// components/BlueSkyLogin.jsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const SESSION_KEY = 'bluesky_oauth_session'

export default function BlueSkyLogin({ className = '' }) {
  const [handle, setHandle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [name, setName] = useState(null)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return

    (async () => {
      try {
        const data = JSON.parse(stored)
        const a = new AtpAgent({ service: 'https://bsky.social' })
        await a.resumeSession(data)
        const { data: p } = await a.app.bsky.actor.getProfile({ actor: a.session.did })
        setAvatar(p.avatar || null)
        setName(p.displayName || p.handle)
        setSignedIn(true)
      } catch (err) {
        localStorage.removeItem(SESSION_KEY)
      }
    })()
  }, [])

  const signIn = async () => {
    setError('')
    setLoading(true)

    if (!handle.trim()) {
      setError('Enter your Bluesky handle')
      setLoading(false)
      return
    }

    try {
      // Quick public check: does this handle exist?
      const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle.trim())}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError('Handle not found — check spelling or if the account exists')
        } else {
          setError('Could not verify handle (network issue)')
        }
        setLoading(false)
        return
      }

      const data = await res.json()
      // Handle exists — proceed to login redirect
      const authUrl = `https://bsky.social/oauth/authorize?` +
        `client_id=https://sociallydead.me/client-metadata.json&` +
        `redirect_uri=https://sociallydead.me/oauth-callback&` +
        `response_type=code&` +
        `scope=atproto%20transition:email%20transition:offline_access`

      window.location.href = authUrl
    } catch (err) {
      setError('Failed to start sign-in — check internet or try again')
      setLoading(false)
    }
  }

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY)
    setSignedIn(false)
    setAvatar(null)
    setName(null)
  }

  if (signedIn && (avatar || name)) {
    return (
      <div className={`w-40 flex flex-col items-center gap-3 ${className}`}>
        <Avatar className="h-10 w-10">
          {avatar && <AvatarImage src={avatar} alt={name || 'You'} />}
          <AvatarFallback>{name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <div className="text-center text-sm font-medium truncate w-full">
          {name || 'Signed in'}
        </div>
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={signOut}>
          Sign out
        </Button>
      </div>
    )
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
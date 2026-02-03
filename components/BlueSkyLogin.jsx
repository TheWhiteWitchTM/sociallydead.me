// components/BlueSkyLogin.jsx
'use client'

import { useState, useEffect } from 'react'
import { AtpAgent } from '@atproto/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'

const SESSION_KEY = 'bluesky_oauth_session'
const YOUR_HANDLE = 'thewhitewitchtm.sociallydead.me' // your handle - change if needed

export default function BlueSkyLogin({ className = '' }) {
  const [agent, setAgent] = useState(null)
  const [avatar, setAvatar] = useState(null)
  const [name, setName] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setErr(null)

      // Try restore session first
      const stored = localStorage.getItem(SESSION_KEY)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          const a = new AtpAgent({ service: 'https://bsky.social' })
          await a.resumeSession(data)
          setAgent(a)
          const { data: p } = await a.app.bsky.actor.getProfile({ actor: a.session.did })
          setAvatar(p.avatar || null)
          setName(p.displayName || p.handle)
          setLoading(false)
          return
        } catch (err) {
          console.error('Session restore failed', err)
          localStorage.removeItem(SESSION_KEY)
        }
      }

      // Fallback: public profile fetch (no session needed)
      try {
        const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${YOUR_HANDLE}`)
        if (!res.ok) throw new Error('Profile not found')
        const data = await res.json()
        setAvatar(data.avatar || null)
        setName(data.displayName || data.handle)
      } catch (e) {
        setErr(e.message || 'Could not load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const signIn = async () => {
    // Your sign-in logic here (redirect, popup, etc.)
    // For example simple redirect:
    window.location.href = 'https://bsky.app/login'
  }

  if (loading) {
    return (
      <div className={`w-40 flex justify-center ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (err) {
    return (
      <div className={`w-40 text-xs text-red-500 text-center ${className}`}>
        {err}
        <Button size="sm" variant="outline" className="mt-2 w-full text-xs" onClick={signIn}>
          Sign in to load
        </Button>
      </div>
    )
  }

  return (
    <div className={`w-40 flex flex-col items-center gap-3 ${className}`}>
      <Avatar className="h-10 w-10">
        {avatar ? <AvatarImage src={avatar} alt={name || 'Profile'} /> : null}
        <AvatarFallback>{name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
      </Avatar>

      <div className="text-center text-sm font-medium truncate w-full">
        {name || 'Loading...'}
      </div>

      {!agent && (
        <Button size="sm" variant="outline" className="w-full text-xs" onClick={signIn}>
          Sign in
        </Button>
      )}
    </div>
  )
}
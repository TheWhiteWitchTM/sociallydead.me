// components/BlueSkyLogin.jsx
'use client'

import { useState, useEffect } from 'react'
import { AtpAgent } from '@atproto/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'

const SESSION_KEY = 'bluesky_oauth_session'
const CLIENT_ID = 'https://sociallydead.me/client-metadata.json'
const REDIRECT_URI = 'https://sociallydead.me/oauth-callback'

export default function BlueSkyLogin({ className = '' }) {
  const [agent, setAgent] = useState(null)
  const [avatar, setAvatar] = useState(null)
  const [name, setName] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return

    try {
      const data = JSON.parse(stored)
      const a = new AtpAgent({ service: 'https://bsky.social' })
      a.resumeSession(data)
      setAgent(a)
      a.app.bsky.actor.getProfile({ actor: a.session.did }).then(({ data: p }) => {
        setAvatar(p.avatar || null)
        setName(p.displayName || p.handle)
      })
    } catch (err) {
      console.error('Session restore failed', err)
      localStorage.removeItem(SESSION_KEY)
    }
  }, [])

  const signIn = async () => {
    setLoading(true)
    try {
      // Build Bluesky authorize URL manually (no library needed for redirect flow)
      const authUrl = new URL('https://bsky.app/authorize')
      authUrl.searchParams.set('client_id', CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', 'atproto transition:email transition:offline_access')

      console.log('Redirecting to:', authUrl.toString())
      window.location.href = authUrl.toString()
    } catch (err) {
      console.error('Redirect failed', err)
      setLoading(false)
    }
  }

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY)
    setAgent(null)
    setAvatar(null)
    setName(null)
  }

  return (
    <div className={`w-40 flex flex-col items-center gap-3 ${className}`}>
      {avatar || name ? (
        <>
          <Avatar className="h-10 w-10">
            {avatar && <AvatarImage src={avatar} alt={name || 'User'} />}
            <AvatarFallback>{name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
          <div className="text-center text-sm font-medium truncate w-full">
            {name || 'Signed in'}
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={signOut}>
            Sign out
          </Button>
        </>
      ) : (
        <Button size="sm" className="w-full" onClick={signIn} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecting...
            </>
          ) : (
            'Sign in with Bluesky'
          )}
        </Button>
      )}
    </div>
  )
}
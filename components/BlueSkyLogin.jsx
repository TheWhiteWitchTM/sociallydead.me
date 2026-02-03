// components/BlueSkyLogin.jsx
'use client'

import { useState, useEffect } from 'react'
import { BrowserOAuthClient } from '@atproto/oauth-client-browser'
import { AtpAgent } from '@atproto/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'

const SESSION_KEY = 'bluesky_oauth_session'

export default function BlueSkyLogin({ className = '' }) {
  const [agent, setAgent] = useState(null)
  const [avatar, setAvatar] = useState(null)
  const [name, setName] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem(SESSION_KEY)
      if (!stored) return

      try {
        const data = JSON.parse(stored)
        const a = new AtpAgent({ service: 'https://bsky.social' })
        await a.resumeSession(data)
        setAgent(a)
        const { data: p } = await a.app.bsky.actor.getProfile({ actor: a.session.did })
        setAvatar(p.avatar || null)
        setName(p.displayName || p.handle)
      } catch (err) {
        console.error('Restore failed', err)
        localStorage.removeItem(SESSION_KEY)
      }
    }

    restore()
  }, [])

  const signIn = async () => {
    setLoading(true)
    try {
      // @ts-ignore Library type inference broken - works at runtime
      const client = new BrowserOAuthClient({
        clientMetadata: {
          client_id: 'https://sociallydead.me/client-metadata.json',
          redirect_uris: ['https://sociallydead.me/oauth-callback'],
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          token_endpoint_auth_method: 'none'
        }
      })

      const url = await client.authorize({ scope: 'atproto transition:email transition:offline_access' })
      console.log('Opening Bluesky login popup:', url)

      const popup = window.open(url, '_blank', 'width=600,height=700')

      if (!popup) {
        console.error('Popup blocked')
        alert('Popup blocked - allow popups for sociallydead.me')
        setLoading(false)
        return
      }

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer)
          console.log('Popup closed - checking session')
          const stored = localStorage.getItem(SESSION_KEY)
          if (stored) {
            console.log('Session found - restoring')
            restore()
          } else {
            console.warn('No session saved')
          }
        }
      }, 500)
    } catch (err) {
      console.error('Sign in error:', err)
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY)
    setAgent(null)
    setAvatar(null)
    setName(null)
  }

  const restore = async () => {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return
    try {
      const data = JSON.parse(stored)
      const a = new AtpAgent({ service: 'https://bsky.social' })
      await a.resumeSession(data)
      setAgent(a)
      const { data: p } = await a.app.bsky.actor.getProfile({ actor: a.session.did })
      setAvatar(p.avatar || null)
      setName(p.displayName || p.handle)
    } catch (err) {
      console.error(err)
    }
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
              Signing in...
            </>
          ) : (
            'Sign in with Bluesky'
          )}
        </Button>
      )}
    </div>
  )
}
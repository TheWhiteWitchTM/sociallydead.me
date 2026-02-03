// components/BlueSkyLogin.jsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export default function BlueSkyLogin({ className = '' }) {
  const [handle, setHandle] = useState('')
  const [loading, setLoading] = useState(false)

  const signIn = () => {
    setLoading(true)

    const authUrl = `https://bsky.social/oauth/authorize?` +
      `client_id=https://sociallydead.me/client-metadata.json&` +
      `redirect_uri=https://sociallydead.me/oauth-callback&` +
      `response_type=code&` +
      `scope=atproto transition:email transition:offline_access`

    console.log('Redirecting to:', authUrl)
    window.location.href = authUrl
  }

  return (
    <div className={`w-40 flex flex-col gap-3 ${className}`}>
      <Input
        placeholder="Your Bluesky handle (optional)"
        value={handle}
        onChange={e => setHandle(e.target.value)}
        className="h-8 text-sm"
        disabled={loading}
      />

      <Button
        size="sm"
        className="w-full"
        onClick={signIn}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting...
          </>
        ) : (
          'Sign in with Bluesky'
        )}
      </Button>

      <p className="text-[10px] text-gray-500 text-center">
        You'll be taken to bsky.social to enter your username and password
      </p>
    </div>
  )
}
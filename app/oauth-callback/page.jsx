'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BrowserOAuthClient } from '@atproto/oauth-client-browser'

export default function OAuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      console.error('No code in callback URL')
      return
    }

    (async () => {
      try {
        // @ts-ignore
        const client = new BrowserOAuthClient({
          clientMetadata: {
            client_id: 'https://sociallydead.me/client-metadata.json'
          }
        })

        const result = await client.callback(new URLSearchParams(window.location.search))
        if (result.session) {
          console.log('Session saved from callback')
          localStorage.setItem('bluesky_oauth_session', JSON.stringify(result.session))
          router.push('/')
        }
      } catch (err) {
        console.error('Callback failed:', err)
      }
    })()
  }, [searchParams, router])

  return <div>Logging in... Redirecting.</div>
}
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useBluesky } from "@/lib/bluesky-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Loader2, UserPlus, UserMinus, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface UserHoverCardProps {
  handle: string
  children: React.ReactNode
}

interface ProfileData {
  did: string
  handle: string
  displayName?: string
  avatar?: string
  description?: string
  followersCount?: number
  followsCount?: number
  postsCount?: number
  viewer?: {
    following?: string
    followedBy?: string
    muted?: boolean
    blocking?: string
  }
  createdAt?: string
}

export function UserHoverCard({ handle, children }: UserHoverCardProps) {
  const { getProfile, followUser, unfollowUser, isAuthenticated } = useBluesky()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const loadProfile = async () => {
    if (hasLoaded || isLoading) return
    setIsLoading(true)
    try {
      const data = await getProfile(handle)
      setProfile(data as ProfileData)
      setHasLoaded(true)
    } catch (error) {
      console.error("Failed to load profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!profile || !isAuthenticated) return
    setIsFollowLoading(true)
    try {
      if (profile.viewer?.following) {
        await unfollowUser(profile.viewer.following)
        setProfile({
          ...profile,
          viewer: { ...profile.viewer, following: undefined },
          followersCount: (profile.followersCount || 1) - 1,
        })
      } else {
        const result = await followUser(profile.did)
        setProfile({
          ...profile,
          viewer: { ...profile.viewer, following: result.uri },
          followersCount: (profile.followersCount || 0) + 1,
        })
      }
    } catch (error) {
      console.error("Failed to follow/unfollow:", error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  const isFollowing = !!profile?.viewer?.following
  const followsYou = !!profile?.viewer?.followedBy

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild onMouseEnter={loadProfile}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="bottom" align="start">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : profile ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <Link href={`/profile/${profile.handle}`}>
                <Avatar className="h-14 w-14 cursor-pointer hover:opacity-80">
                  <AvatarImage src={profile.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {(profile.displayName || profile.handle).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              {isAuthenticated && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-1" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>

            <div>
              <Link href={`/profile/${profile.handle}`} className="hover:underline">
                <h4 className="font-semibold">{profile.displayName || profile.handle}</h4>
              </Link>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>@{profile.handle}</span>
                {followsYou && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Follows you</span>
                )}
              </div>
            </div>

            {profile.description && (
              <p className="text-sm line-clamp-3">{profile.description}</p>
            )}

            <div className="flex gap-4 text-sm">
              <Link href={`/profile/${profile.handle}?tab=following`} className="hover:underline">
                <span className="font-semibold">{profile.followsCount?.toLocaleString() || 0}</span>
                <span className="text-muted-foreground ml-1">Following</span>
              </Link>
              <Link href={`/profile/${profile.handle}?tab=followers`} className="hover:underline">
                <span className="font-semibold">{profile.followersCount?.toLocaleString() || 0}</span>
                <span className="text-muted-foreground ml-1">Followers</span>
              </Link>
            </div>

            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{profile.postsCount?.toLocaleString() || 0} posts</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Failed to load profile
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}

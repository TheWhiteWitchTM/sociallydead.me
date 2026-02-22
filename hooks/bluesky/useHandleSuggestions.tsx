"use client"

import { useState, useEffect, useCallback } from "react"
import { useBluesky } from "@/lib/bluesky-context"

interface HandleSuggestion {
	handle: string
	displayName?: string
	avatar?: string
	did: string
}

export function useHandleSuggestions(prefix: string, limit = 8) {
	const { getAgent } = useBluesky()

	const [suggestions, setSuggestions] = useState<HandleSuggestion[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchSuggestions = useCallback(async () => {
		const trimmed = prefix.trim()
		if (!trimmed) {
			setSuggestions([])
			setIsLoading(false)
			setError(null)
			return
		}

		const agent = getAgent()
		if (!agent) {
			setError("No Bluesky agent available")
			setIsLoading(false)
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const res = await agent.searchActorsTypeahead({
				term: trimmed,
				limit: Math.min(limit, 100),
			})

			const mapped = (res.data.actors ?? [])
				.filter((a: any) => a.handle)
				.map((actor: any) => ({
					handle: actor.handle,
					displayName: actor.displayName ?? undefined,
					avatar: actor.avatar,
					did: actor.did,
				}))

			setSuggestions(mapped)
		} catch (err) {
			console.error("suggestHandles failed", err)
			setError("Failed to load suggestions")
			setSuggestions([])
		} finally {
			setIsLoading(false)
		}
	}, [prefix, limit, getAgent])

	useEffect(() => {
		fetchSuggestions()
	}, [fetchSuggestions])

	return { suggestions, isLoading, error }
}
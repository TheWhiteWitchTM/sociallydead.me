"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { BskyAgent } from "@atproto/api";
import { BrowserOAuthClient } from "@atproto/oauth-client-browser";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, LogIn, LogOut } from "lucide-react";

// ────────────────────────────────────────────────
// CONTEXT
// ────────────────────────────────────────────────
const BskyContext = createContext<{
	agent: BskyAgent | null;
	profile: any | null;
} | null>(null);

export const useBsky = () => {
	const ctx = useContext(BskyContext);
	if (!ctx) throw new Error("useBsky must be used within BlueSkyLogin");
	return ctx;
};

// ────────────────────────────────────────────────
// CONFIG
// ────────────────────────────────────────────────
const CLIENT_METADATA_URL = "https://sociallydead.me/client-metadata.json";
// Must be 200 OK, application/json, no redirects!

const REDIRECT_URI =
	typeof window !== "undefined"
		? `${window.location.origin}/auth/callback`
		: "https://sociallydead.me/auth/callback";

// ────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────
export default function BlueSkyLogin({ children }: { children: React.ReactNode }) {
	const [agent, setAgent] = useState<BskyAgent | null>(null);
	const [profile, setProfile] = useState<any | null>(null);
	const [handle, setHandle] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const oauthClientRef = useRef<BrowserOAuthClient | null>(null);
	const agentRef = useRef<BskyAgent>(new BskyAgent({ service: "https://bsky.social" }));

	// Load OAuth client once (using correct .load() method)
	useEffect(() => {
		let mounted = true;

		(async () => {
			try {
				const client = await BrowserOAuthClient.load({
					clientId: CLIENT_METADATA_URL,
					handleResolver: (h: string) => `https://${h.replace(/^@/, "")}`,
				});
				if (mounted) {
					oauthClientRef.current = client;
				}
			} catch (err) {
				console.error("Failed to load Bluesky OAuth client", err);
				setError("OAuth setup failed – check your client-metadata.json URL and console");
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

	// Resume session from localStorage
	useEffect(() => {
		const stored = localStorage.getItem("bsky_oauth_session");
		if (stored) {
			try {
				const session = JSON.parse(stored);
				agentRef.current.session = session;
				setAgent(agentRef.current);
			} catch (err) {
				console.warn("Invalid stored session", err);
				localStorage.removeItem("bsky_oauth_session");
			}
		}
	}, []);

	// Fetch profile
	useEffect(() => {
		if (!agent?.session?.handle) return;

		(async () => {
			try {
				const { data } = await agent.getProfile({ actor: agent.session.handle });
				setProfile(data);
			} catch (err) {
				console.error("Profile fetch failed", err);
			}
		})();
	}, [agent]);

	const startLogin = async () => {
		if (!oauthClientRef.current) {
			setError("OAuth client not ready – refresh and try again");
			return;
		}
		if (!handle.trim()) {
			setError("Enter your @handle");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const authUrl = await oauthClientRef.current.authorize(handle.trim(), {
				scope: "atproto transition:generic",
				redirect_uri: REDIRECT_URI,
				state: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
			});

			window.location.href = authUrl.toString();
		} catch (err: any) {
			setError(err.message || "Login start failed");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const logout = () => {
		localStorage.removeItem("bsky_oauth_session");
		agentRef.current.session = undefined;
		setAgent(null);
		setProfile(null);
	};

	if (!agent) {
		return (
			<div className="p-3 border-b">
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" className="w-full justify-start gap-2">
							<LogIn className="h-4 w-4" />
							Sign in to Bluesky
						</Button>
					</DialogTrigger>

					<DialogContent className="sm:max-w-[360px]">
						<DialogHeader>
							<DialogTitle>Sign in to Bluesky</DialogTitle>
						</DialogHeader>

						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="handle">Your handle</Label>
								<Input
									id="handle"
									placeholder="@username.bsky.social"
									value={handle}
									onChange={(e) => setHandle(e.target.value)}
									autoFocus
									disabled={loading}
								/>
							</div>

							{error && <p className="text-sm text-destructive">{error}</p>}

							<Button
								onClick={startLogin}
								disabled={loading || !handle.trim() || !oauthClientRef.current}
							>
								{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Continue
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		);
	}

	return (
		<BskyContext.Provider value={{ agent: agentRef.current, profile }}>
			<div className="flex items-center justify-between p-3 border-b gap-2">
				<div className="flex items-center gap-3 min-w-0">
					<Avatar className="h-9 w-9 shrink-0">
						<AvatarImage src={profile?.avatar} alt={profile?.displayName} />
						<AvatarFallback>
							{profile?.displayName?.[0] ?? profile?.handle?.[0] ?? "?"}
						</AvatarFallback>
					</Avatar>

					<div className="flex flex-col min-w-0">
            <span className="font-medium text-sm truncate">
              {profile?.displayName || profile?.handle || "You"}
            </span>
						<span className="text-xs text-muted-foreground truncate">
              @{profile?.handle}
            </span>
					</div>
				</div>

				<Button variant="ghost" size="icon" onClick={logout} title="Log out">
					<LogOut className="h-4 w-4" />
				</Button>
			</div>

			{children}
		</BskyContext.Provider>
	);
}
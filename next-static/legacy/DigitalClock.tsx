// /next-static/legacy/DigitalClock.tsx
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
	Sun,
	Moon,
	Cloud,
	CloudRain,
	CloudSnow,
	Zap,
	Wind,
	CloudDrizzle,
} from "lucide-react";

interface DigitalClockProps {
	/** Optional: latitude (if provided, used directly) */
	latitude?: number;
	/** Optional: longitude (if provided, used directly) */
	longitude?: number;
	/** Optional: city name (used with country to geocode) */
	city?: string;
	/** Optional: country code (ISO 3166-1 alpha-2, e.g. "DE") */
	country?: string;
	/** Optional: custom className for the widget */
	className?: string;
}

export function DigitalClock({
	                             latitude,
	                             longitude,
	                             city,
	                             country,
	                             className,
                             }: DigitalClockProps) {
	const [time, setTime] = useState("");
	const [dateInfo, setDateInfo] = useState("");
	const [weather, setWeather] = useState<{
		temp: string;
		icon: React.ComponentType<{ className?: string }>;
	} | null>(null);
	const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

	// 1. Resolve coordinates
	useEffect(() => {
		if (latitude !== undefined && longitude !== undefined) {
			setCoords({ lat: latitude, lon: longitude });
			return;
		}

		if (!city || !country) return;

		// Free Nominatim geocoding (no key, usage policy: no heavy use, add user-agent if in production)
		fetch(
			`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
				`${city}, ${country}`
			)}&format=json&limit=1`
		)
			.then((r) => r.json())
			.then((data) => {
				if (data.length > 0) {
					setCoords({
						lat: parseFloat(data[0].lat),
						lon: parseFloat(data[0].lon),
					});
				}
			})
			.catch(() => setCoords(null));
	}, [latitude, longitude, city, country]);

	// 2. Clock update
	useEffect(() => {
		const updateClock = () => {
			const now = new Date();
			setTime(now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", hour12: false }));
			setDateInfo(now.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" }));
		};

		updateClock();
		const interval = setInterval(updateClock, 60000);
		return () => clearInterval(interval);
	}, []);

	// 3. Weather fetch when coords ready
	useEffect(() => {
		if (!coords) return;

		const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&timezone=Europe%2FBerlin`;

		fetch(url)
			.then((r) => r.json())
			.then((data) => {
				if (data.current) {
					const temp = Math.round(data.current.temperature_2m);
					const wmo = data.current.weather_code;

					let Icon = Cloud;
					if (wmo === 0) Icon = new Date().getHours() >= 6 && new Date().getHours() < 20 ? Sun : Moon;
					else if ([1,2,3].includes(wmo)) Icon = Cloud;
					else if ([45,48].includes(wmo)) Icon = Wind;
					else if ([51,53,55,56,57].includes(wmo)) Icon = CloudDrizzle;
					else if ([61,63,65,66,67].includes(wmo)) Icon = CloudRain;
					else if ([71,73,75,77].includes(wmo)) Icon = CloudSnow;
					else if ([80,81,82].includes(wmo)) Icon = CloudRain;
					else if ([95,96,99].includes(wmo)) Icon = Zap;

					setWeather({ temp: `${temp}°`, icon: Icon });
				}
			})
			.catch(() => setWeather(null));
	}, [coords]);

	return (
		<div className={cn("flex flex-col items-center gap-0.5 font-mono text-center", className)}>
			<div className="text-2xl md:text-3xl font-bold tracking-wide">
				{time || "--:--"}
			</div>
			<div className="text-xs opacity-75">
				{dateInfo || "—"}
			</div>
			{weather ? (
				<div className="flex items-center gap-1.5 text-xs opacity-90 mt-1">
					<weather.icon className="h-4 w-4" />
					<span>{weather.temp}</span>
				</div>
			) : (
				<div className="text-[10px] opacity-60 mt-1">...</div>
			)}
		</div>
	);
}
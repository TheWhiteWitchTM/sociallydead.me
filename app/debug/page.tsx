"use client"

import {useBluesky} from "@/lib/bluesky-context";
import {useEffect, useState} from "react";

export default function () {
	const bluesky = useBluesky();
	const [state, setState] = useState<string>("");
	useEffect(() => {
		const agend = bluesky.getAgent()
		if (!agend)
			setState("Mo agend!");
		if (agend?.did)
			setState(agend.did);
	},[])
	return (
		<div>
			{state}
		</div>
	)
}
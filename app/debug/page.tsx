"use client"

import {useBluesky} from "@/lib/bluesky-context";
import {useEffect, useState} from "react";

export default function () {
	const bluesky = useBluesky();
	const [state, setState] = useState<string>("");
	useEffect(() => {
		setState("Loaded");
	},[])
	return (
		<div>
			{state}
		</div>
	)
}
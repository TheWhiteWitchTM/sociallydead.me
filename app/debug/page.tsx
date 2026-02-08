"use client"

import {useBluesky} from "@/lib/bluesky-context";
import {useEffect, useState} from "react";
import {SociallyDeadRecord, SociallyDeadRepo} from "@/lib/sociallydead-me";

export default function () {
	const bluesky = useBluesky();
	const [repo, setRepo] = useState<SociallyDeadRepo | null>(null);
	const [record, setRecord] = useState<SociallyDeadRecord | null>(null);
	const [state, setState] = useState<string>("");
	
	useEffect(() => {
		const agend = bluesky.getAgent()
		if (!agend) {
			setState("Mo agend!");
			return
		}

		if (agend?.did)
			setState(agend.did);

		const repo = new SociallyDeadRepo(agend)
		setRepo(repo)
	},[])

	useEffect(() => {
		if (repo)
			create()
	},[repo])
	}

	const create = async () => {
		if (!repo) {
			setState('Repo not initialized');
			return;
		}

		setState('Creating default record...');
		console.log('DebugPage: Starting create default');

		const defaultData: Partial<SociallyDeadRecord> = {
			version: 2,
			mood: 'joined sociallydead.me'
		};

		try {
			const { uri, cid } = await repo.createOrUpdate(defaultData);
			setState(`Created successfully! URI: ${uri}, CID: ${cid}`);
			console.log('DebugPage: Create success:', { uri, cid });

			// Refresh record after create
			const rec = await repo.get();
			setRecord(rec);
		} catch (err: any) {
			const msg = err.message || 'Create failed';
			setState(msg);
			console.error('DebugPage: Create error:', msg);
		}
	};

	return (
		<div>
			{state}
		</div>
	)
}
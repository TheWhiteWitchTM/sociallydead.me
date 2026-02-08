import {
	Agent,
	ComAtprotoRepoCreateRecord,
	ComAtprotoRepoDeleteRecord,
	ComAtprotoRepoGetRecord,
	ComAtprotoRepoListRecords,
	ComAtprotoRepoPutRecord,
} from '@atproto/api';

export interface SociallyDeadRecord {
	$type: 'me.sociallydead.app';
	version: number;
	createdAt: string;
	updatedAt?: string;
	mood: string;
	verification: boolean;
	highlights: string[];
	articles: any[];
	props: Record<string, any>;
	[key: string]: any;
}

export class SociallyDeadRepo {
	private agent: Agent;
	private readonly collection = 'me.sociallydead.app';
	private readonly rkey: string;

	constructor(agent: Agent, rkey: string = 'self') {
		this.agent = agent;
		this.rkey = rkey;
	}

	private get did(): string {
		const d = this.agent.did;
		if (!d) throw new Error('Agent has no DID');
		return d;
	}

	private buildRecord(data: Partial<SociallyDeadRecord>): SociallyDeadRecord {
		return {
			$type: this.collection,
			version: data.version ?? 1,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			mood: data.mood ?? 'default mood',
			verification: data.verification ?? false,
			highlights: data.highlights ?? [],
			articles: data.articles ?? [],
			props: data.props ?? {},
			...data,
		};
	}

	async create(data: Partial<SociallyDeadRecord>): Promise<{ uri: string; cid: string }> {
		const record = this.buildRecord(data);

		try {
			await this.agent.com.atproto.repo.getRecord({
				repo: this.did,
				collection: this.collection,
				rkey: this.rkey,
			});
			throw new Error(`Record already exists at rkey "${this.rkey}"`);
		} catch (err: any) {
			if (err?.error !== 'RecordNotFound') throw err;
		}

		const resp = await this.agent.com.atproto.repo.createRecord({
			repo: this.did,
			collection: this.collection,
			rkey: this.rkey,
			record,
		} satisfies ComAtprotoRepoCreateRecord.InputSchema);

		return { uri: resp.data.uri, cid: resp.data.cid };
	}

	async update(
		data: Partial<SociallyDeadRecord>,
		options: { expectedCid?: string } = {}
	): Promise<{ uri: string; cid: string }> {
		const record = this.buildRecord(data);

		const params = {
			repo: this.did,
			collection: this.collection,
			rkey: this.rkey,
			record,
			...(options.expectedCid ? { swapCid: options.expectedCid } : {}),
		} satisfies ComAtprotoRepoPutRecord.InputSchema;

		const resp = await this.agent.com.atproto.repo.putRecord(params);

		return { uri: resp.data.uri, cid: resp.data.cid };
	}

	async upsert(data: Partial<SociallyDeadRecord>): Promise<{ uri: string; cid: string }> {
		let existingCid: string | undefined;
		try {
			const getResp = await this.agent.com.atproto.repo.getRecord({
				repo: this.did,
				collection: this.collection,
				rkey: this.rkey,
			});
			existingCid = getResp.data.cid;
		} catch (err: any) {
			if (err?.error !== 'RecordNotFound') throw err;
		}

		if (existingCid) {
			return this.update(data, { expectedCid: existingCid });
		}

		return this.create(data);
	}

	async get(): Promise<SociallyDeadRecord | null> {
		try {
			const resp = await this.agent.com.atproto.repo.getRecord({
				repo: this.did,
				collection: this.collection,
				rkey: this.rkey,
			} satisfies ComAtprotoRepoGetRecord.QueryParams);
			return resp.data.value as SociallyDeadRecord;
		} catch (err: any) {
			if (err?.error === 'RecordNotFound') return null;
			throw err;
		}
	}

	async delete(): Promise<void> {
		await this.agent.com.atproto.repo.deleteRecord({
			repo: this.did,
			collection: this.collection,
			rkey: this.rkey,
		} satisfies ComAtprotoRepoDeleteRecord.InputSchema);
	}

	async list(limit = 10): Promise<any[]> {
		const resp = await this.agent.com.atproto.repo.listRecords({
			repo: this.did,
			collection: this.collection,
			limit,
		} satisfies ComAtprotoRepoListRecords.QueryParams);
		return resp.data.records;
	}
}
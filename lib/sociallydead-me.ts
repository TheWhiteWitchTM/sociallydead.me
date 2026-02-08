import {
	Agent,
	ComAtprotoRepoCreateRecord,
	ComAtprotoRepoDeleteRecord,
	ComAtprotoRepoGetRecord,
	ComAtprotoRepoListRecords,
} from '@atproto/api';

export interface SociallyDeadRecord {
	$type: 'me.sociallydead.app';
	version: number;
	createdAt: string;
	updatedAt?: string;
	mood: string;
	verified: boolean;
	props: Record<string, any>;
	[key: string]: any;
}

export class SociallyDeadRepo {
	private agent: Agent;
	private readonly collection = 'me.sociallydead.app';
	private readonly rkey = 'self';

	constructor(agent: Agent) {
		this.agent = agent;
	}

	async createOrUpdate(data: Partial<SociallyDeadRecord>): Promise<{ uri: string; cid: string }> {
		const fullRecord: SociallyDeadRecord = {
			$type: this.collection,
			version: data.version ?? 1,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			mood: data.mood ?? 'default mood',
			verified: data.verified ?? false,
			props: data.props ?? {},
			...data,
		};

		const params: ComAtprotoRepoCreateRecord.InputSchema = {
			repo: this.agent.did,
			collection: this.collection,
			rkey: this.rkey,
			record: fullRecord,
		};

		try {
			const resp = await this.agent.com.atproto.repo.createRecord(params);
			return { uri: resp.data.uri, cid: resp.data.cid };
		} catch (err: any) {
			throw err;
		}
	}

	async get(): Promise<SociallyDeadRecord | null> {
		const params: ComAtprotoRepoGetRecord.QueryParams = {
			repo: this.agent.did,
			collection: this.collection,
			rkey: this.rkey,
		};

		try {
			const resp = await this.agent.com.atproto.repo.getRecord(params);
			return resp.data.value as SociallyDeadRecord;
		} catch (err: any) {
			if (err?.error === 'RecordNotFound') {
				return null;
			}
			throw err;
		}
	}

	async getField<K extends keyof SociallyDeadRecord>(field: K): Promise<SociallyDeadRecord[K] | undefined> {
		const record = await this.get();
		if (!record) return undefined;
		return record[field];
	}

	async editField<K extends keyof SociallyDeadRecord>(
		field: K,
		value: SociallyDeadRecord[K]
	): Promise<void> {
		const current = await this.get();

		if (!current) {
			await this.createOrUpdate({ [field]: value });
			return;
		}

		const updated: Partial<SociallyDeadRecord> = {
			...current,
			[field]: value,
			updatedAt: new Date().toISOString(),
		};

		await this.createOrUpdate(updated);
	}

	async delete(): Promise<void> {
		const params: ComAtprotoRepoDeleteRecord.InputSchema = {
			repo: this.agent.did,
			collection: this.collection,
			rkey: this.rkey,
		};

		await this.agent.com.atproto.repo.deleteRecord(params);
	}

	async list(limit = 10): Promise<any[]> {
		const resp = await this.agent.com.atproto.repo.listRecords({
			repo: this.agent.did,
			collection: this.collection,
			limit,
		});
		return resp.data.records;
	}
}
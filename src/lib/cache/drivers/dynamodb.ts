import type { Cache } from "../types";

export async function createDynamoDBCache(config: {
	tableName: string;
	region?: string;
	endpoint?: string;
	accessKeyId?: string;
	secretAccessKey?: string;
	defaultTtl: number;
}): Promise<Cache> {
	const { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand } =
		await import("@aws-sdk/lib-dynamodb");
	const { DynamoDBClient } = await import("@aws-sdk/client-dynamodb");

	const client = new DynamoDBClient({
		...(config.region ? { region: config.region } : { region: "us-east-1" }),
		...(config.endpoint ? { endpoint: config.endpoint } : {}),
		...(config.accessKeyId && config.secretAccessKey
			? { credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } }
			: {}),
	} as never);
	const doc = DynamoDBDocumentClient.from(client);
	const table = config.tableName;
	const defaultTtl = config.defaultTtl;

	return {
		async get<T>(key: string): Promise<T | null> {
			const result = (await doc.send(new GetCommand({ TableName: table, Key: { pk: key } }))) as {
				Item?: { value: string; expiresAt?: number };
			};
			if (!result.Item) {
				return null;
			}
			if (result.Item.expiresAt && result.Item.expiresAt <= Date.now() / 1000) {
				await doc.send(new DeleteCommand({ TableName: table, Key: { pk: key } }));
				return null;
			}
			try {
				return JSON.parse(result.Item.value) as T;
			} catch {
				return result.Item.value as unknown as T;
			}
		},

		async set(key: string, value: unknown, ttl?: number): Promise<void> {
			const serialized = typeof value === "string" ? value : JSON.stringify(value);
			const item: Record<string, unknown> = {
				pk: key,
				value: serialized,
			};
			const t = ttl ?? defaultTtl;
			if (t > 0) {
				item.expiresAt = Math.floor(Date.now() / 1000) + t;
			}
			await doc.send(new PutCommand({ TableName: table, Item: item }));
		},

		async delete(key: string): Promise<void> {
			await doc.send(new DeleteCommand({ TableName: table, Key: { pk: key } }));
		},

		async clear(): Promise<void> {
			let lastKey: Record<string, unknown> | undefined;
			do {
				const result = (await doc.send(
					new ScanCommand({
						TableName: table,
						ProjectionExpression: "pk",
						...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
					}),
				)) as { Items?: { pk: string }[]; LastEvaluatedKey?: Record<string, unknown> };
				if (result.Items && result.Items.length > 0) {
					await Promise.all(
						result.Items.map((item) => doc.send(new DeleteCommand({ TableName: table, Key: { pk: item.pk } }))),
					);
				}
				lastKey = result.LastEvaluatedKey;
			} while (lastKey);
		},

		async has(key: string): Promise<boolean> {
			const result = (await doc.send(
				new GetCommand({ TableName: table, Key: { pk: key }, ProjectionExpression: "pk" }),
			)) as { Item?: { expiresAt?: number } };
			if (!result.Item) {
				return false;
			}
			if (result.Item.expiresAt && result.Item.expiresAt <= Date.now() / 1000) {
				await doc.send(new DeleteCommand({ TableName: table, Key: { pk: key } }));
				return false;
			}
			return true;
		},
	};
}

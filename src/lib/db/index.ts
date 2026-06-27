import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { schema } from "./schema";

let _db: ReturnType<typeof drizzle>;

export async function getDb() {
	if (!_db) {
		const url = process.env.DATABASE_URL || "postgres://user:password@localhost:5432/authorization";
		const pool = new Pool({ connectionString: url });
		_db = drizzle({ client: pool, schema });
	}
	return _db;
}

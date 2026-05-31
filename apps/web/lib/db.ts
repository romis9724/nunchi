import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ?? "postgresql://localhost/noonchi";
    pool = new Pool({ connectionString, max: 10 });
  }
  return pool;
}

export async function query<T extends object = Record<string, unknown>>(
  text: string,
  values?: unknown[]
): Promise<T[]> {
  const client = getPool();
  const result = await client.query<T>(text, values);
  return result.rows;
}

import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ?? "postgresql://localhost/noonchi";
    // RDS는 TLS 연결을 요구한다. PGSSL=disable(로컬 개발)일 때만 비활성화.
    const ssl =
      process.env.PGSSL === "disable"
        ? false
        : { rejectUnauthorized: false };
    pool = new Pool({ connectionString, max: 10, ssl });
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

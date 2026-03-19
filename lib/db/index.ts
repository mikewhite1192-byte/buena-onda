import postgres from "postgres";

let _db: ReturnType<typeof postgres> | null = null;

function getDb(): ReturnType<typeof postgres> {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("Missing DATABASE_URL — add it to .env.local");
    }
    const url = process.env.DATABASE_URL.replace(/^postgresql:\/\//, "postgres://");
    _db = postgres(url);
  }
  return _db;
}

export default getDb;

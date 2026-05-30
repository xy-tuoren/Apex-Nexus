import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "apex_nexus";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getMongoDb(): Promise<Db | null> {
  if (!uri) {
    return null;
  }

  if (cachedDb) {
    return cachedDb;
  }

  cachedClient = cachedClient ?? new MongoClient(uri);
  await cachedClient.connect();
  cachedDb = cachedClient.db(dbName);

  return cachedDb;
}

export function isMongoConfigured() {
  return Boolean(uri);
}

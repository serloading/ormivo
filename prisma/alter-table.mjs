import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isOzelKoleksiyon" BOOLEAN NOT NULL DEFAULT FALSE`);
console.log("✓ Column added");
await client.end();

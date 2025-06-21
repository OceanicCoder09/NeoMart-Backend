import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

export const sql = neon(
  `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`
);

// Test connection immediately on load
(async () => {
  try {
    const result = await sql`SELECT NOW()`;
    console.log("✅ DB is connected at:", result[0].now);
  } catch (error) {
    console.error("❌ DB connection failed:", error);
  }
})();

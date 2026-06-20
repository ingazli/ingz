import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL is required for Prisma PostgreSQL connection.");
	}

	// Enable SSL when connecting to Supabase or when PGSSLMODE=require is set.
	// Supabase requires TLS but may present a CA that Node doesn't recognize by default;
	// disabling `rejectUnauthorized` allows the client to connect in local dev.
	// Only enable this automatically for known hosts to avoid weakening security elsewhere.
	const poolConfig: any = {
		connectionString,
		// Increase pool size to handle concurrent requests
		max: 20, // Maximum number of clients in the pool
		idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
		connectionTimeoutMillis: 5000, // How long to wait for a connection from the pool
	};
	if (connectionString.includes("supabase.co") || process.env.PGSSLMODE === "require") {
		poolConfig.ssl = { rejectUnauthorized: false };
	}

	const pool = new Pool(poolConfig);
	const adapter = new PrismaPg(pool);
	return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

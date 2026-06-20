import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import readline from "readline";

type CliArgs = {
  email: string;
  name: string;
  password: string | null;
  promptPassword: boolean;
};

function printUsage() {
  console.log(
    "Usage: npm run create:client -- --email client@example.com --name \"Client Name\" --password \"TempPass123!\""
  );
  console.log(
    "Safe:  npm run create:client:safe -- --email client@example.com --name \"Client Name\""
  );
}

function promptHidden(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const onDataHandler = (char: Buffer) => {
      const text = char.toString();
      if (text === "\n" || text === "\r" || text === "\u0004") {
        process.stdout.write("\n");
      } else {
        process.stdout.write("*");
      }
    };

    process.stdin.on("data", onDataHandler);
    rl.question(query, (value) => {
      process.stdin.removeListener("data", onDataHandler);
      rl.close();
      resolve(value);
    });
  });
}

function parseArgs(argv: string[]): CliArgs {
  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const map = new Map<string, string>();
  const booleanFlags = new Set(["prompt-password"]);

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;

    const key = arg.slice(2);
    if (booleanFlags.has(key)) {
      map.set(key, "true");
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    map.set(key, next);
    i += 1;
  }

  const email = (map.get("email") ?? "").trim().toLowerCase();
  const name = (map.get("name") ?? "").trim();
  const password = map.get("password") ?? null;
  const promptPassword = argv.includes("--prompt-password");

  if (!email || !name || (!password && !promptPassword)) {
    printUsage();
    throw new Error("Missing required arguments.");
  }

  return { email, name, password, promptPassword };
}

async function main() {
  const { email, name, password, promptPassword } = parseArgs(process.argv.slice(2));

  const finalPassword =
    password ??
    (promptPassword
      ? await promptHidden("Enter password for new client user: ")
      : null);

  if (!finalPassword || finalPassword.trim().length < 8) {
    throw new Error("Password is required and must be at least 8 characters.");
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const poolConfig: ConstructorParameters<typeof Pool>[0] = { connectionString };
  if (connectionString.includes("supabase.co")) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  const pool = new Pool(poolConfig);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const hashedPassword = await bcrypt.hash(finalPassword, 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        password: hashedPassword,
        role: "CLIENT",
      },
      create: {
        email,
        name,
        password: hashedPassword,
        role: "CLIENT",
      },
    });

    console.log(`Client user ready: ${user.email} (${user.id})`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

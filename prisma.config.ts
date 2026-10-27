import "dotenv/config";
import { defineConfig } from "prisma/config";

import { prismaCliUrl } from "./src/lib/dbConnection";

/**
 * The Prisma CLI (migrate deploy, migrate diff, studio). Remote hosts get TLS
 * parameters added (see src/lib/dbConnection.ts). DIRECT_URL wins when set.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: prismaCliUrl(process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"]),
  },
});

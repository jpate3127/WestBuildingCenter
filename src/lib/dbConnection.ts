/**
 * How to connect to Postgres from where this process runs.
 *
 * The database is Railway's Postgres. The website reaches it over Railway's
 * private network (`*.railway.internal`), where TLS is unnecessary. A PC
 * reaches it over the public TCP proxy, where the connection must be
 * encrypted; Railway's Postgres serves a self-signed certificate, so it is
 * encrypted without verifying the certificate chain.
 *
 * Rules (DATABASE_SSL overrides: "disable" | "require" | "verify"):
 *   - an explicit `sslmode` in the URL wins;
 *   - localhost and *.railway.internal: no TLS;
 *   - anything else: TLS, certificate not verified.
 *
 * No server-only imports: prisma.config.ts (the CLI) uses this too.
 */

export type SslSetting = false | { rejectUnauthorized: boolean };

const LIBPQ_PARAMS = ["sslmode", "sslaccept", "uselibpqcompat", "sslcert", "sslkey", "sslrootcert"];

export function isPrivateOrLocalHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".railway.internal");
}

function fromMode(mode: string): SslSetting | null {
  switch (mode.toLowerCase()) {
    case "disable":
      return false;
    case "prefer":
    case "require":
    case "no-verify":
      return { rejectUnauthorized: false };
    case "verify":
    case "verify-ca":
    case "verify-full":
      return { rejectUnauthorized: true };
    default:
      return null;
  }
}

export function sslFor(connectionString: string, override = process.env.DATABASE_SSL): SslSetting {
  const url = new URL(connectionString);
  const forced = override?.trim() ? fromMode(override.trim()) : null;
  if (forced !== null) return forced;
  const fromUrl = url.searchParams.get("sslmode");
  const explicit = fromUrl ? fromMode(fromUrl) : null;
  if (explicit !== null) return explicit;
  return isPrivateOrLocalHost(url.hostname) ? false : { rejectUnauthorized: false };
}

/** Options for node-postgres: the URL without libpq-only parameters, plus an explicit `ssl`. */
export function pgConnectionOptions(connectionString: string): { connectionString: string; ssl: SslSetting } {
  const ssl = sslFor(connectionString);
  const url = new URL(connectionString);
  for (const param of LIBPQ_PARAMS) url.searchParams.delete(param);
  return { connectionString: url.toString(), ssl };
}

/** The URL for the Prisma CLI, whose engine reads libpq-style parameters. */
export function prismaCliUrl(connectionString: string | undefined): string | undefined {
  if (!connectionString) return connectionString;
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return connectionString;
  }
  if (url.searchParams.has("sslmode")) return connectionString;
  const ssl = sslFor(connectionString);
  if (ssl === false) return connectionString;
  url.searchParams.set("sslmode", "require");
  if (!ssl.rejectUnauthorized) url.searchParams.set("sslaccept", "accept_invalid_certs");
  return url.toString();
}

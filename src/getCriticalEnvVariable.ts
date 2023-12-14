/**
 * Gets an environment variable from memory, but throws if not found.
 *
 * @param key The key of the env var to get
 * @returns The value of the desired env var.
 */
export default function getCriticalEnvVariable(key: string): string {
  if (!(key in process.env) || !process.env[key]) {
    throw new Error(`Missing critical environment variable '${key}'`);
  }

  return process.env[key] || "";
}

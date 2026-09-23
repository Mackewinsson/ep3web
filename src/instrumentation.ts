export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureDbSchema } = await import("@/db/ensure-schema");
  await ensureDbSchema();
}

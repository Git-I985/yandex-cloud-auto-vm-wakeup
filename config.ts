// Все настройки читаются из .env (Bun сам его подхватывает)

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Env var ${name} is required`);
  return v;
}

export const API_BASE_URL =
  "https://compute.api.cloud.yandex.net/compute/v1/instances";


/* The IAM token's lifetime may not exceed 12 HOURS, IAM token obtained with OAuth token (ONE YEAR LIFETIME) */
export const YC_OAUTH_TOKEN = required("YC_OAUTH_TOKEN");
export const YC_INSTANCE_ID = required("YC_INSTANCE_ID");
export const PROBE_URL = required("PROBE_URL");
export const PROBE_INTERVAL_SECONDS = Number(process.env.PROBE_INTERVAL_SECONDS ?? 5);
export const PROBE_TIMEOUT_SECONDS = Number(process.env.PROBE_TIMEOUT_SECONDS ?? 3);
export const PROBE_RETRIES = Number(process.env.PROBE_RETRIES ?? 3);
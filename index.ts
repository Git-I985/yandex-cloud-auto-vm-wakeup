import {
  YC_INSTANCE_ID,
  PROBE_INTERVAL_SECONDS,
  API_BASE_URL,
  RESTART_STATUSES,
  TRANSIENT_STATUSES,
  RECHECK_MS,
} from "./config.ts";
import { wait, log, getApiAuthHeaders } from "./utils.ts";
import type { Instance, Operation } from "./types.ts";

export async function getInstanceById(id: string): Promise<Instance> {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "GET",
    headers: await getApiAuthHeaders(),
  });

  if (!res.ok)
    throw new Error(`getInstance failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as Instance;
}

export async function startInstance(id: string): Promise<Operation> {
  const res = await fetch(`${API_BASE_URL}/${id}:start`, {
    method: "POST",
    headers: await getApiAuthHeaders(),
  });
  if (!res.ok)
    throw new Error(`startInstance failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as Operation;
}

async function main() {
  log(`Monitoring: ${YC_INSTANCE_ID}`);
  log(`Interval: ${PROBE_INTERVAL_SECONDS}s`);

  while (true) {
    let nextWaitMs = PROBE_INTERVAL_SECONDS * 1000;

    try {
      const instance = await getInstanceById(YC_INSTANCE_ID);

      if (RESTART_STATUSES.includes(instance.status)) {
        await startInstance(instance.id);
        nextWaitMs = RECHECK_MS;
        log(
          `Instance status is ${instance.status}, restart required. Start command sent, rechecking in ${nextWaitMs / 1000}s`,
        );
      } else if (TRANSIENT_STATUSES.includes(instance.status)) {
        nextWaitMs = RECHECK_MS;
        log(
          `Instance status is ${instance.status} (transient), rechecking in ${nextWaitMs / 1000}s`,
        );
      } else {
        log(`Instance status is ${instance.status}`);
      }
    } catch (e) {
      log(`Error: ${(e as Error).message}`);
    }

    await wait(nextWaitMs);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

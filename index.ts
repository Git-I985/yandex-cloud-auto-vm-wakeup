import {
  YC_INSTANCE_ID,
  PROBE_INTERVAL_SECONDS,
  PROBE_TIMEOUT_SECONDS,
  PROBE_RETRIES as PROBE_RETRIES,
  API_BASE_URL,
  PROBE_URL
} from "./config.ts";
import { wait, log } from "./utils.ts";
import { getApiAuthHeaders } from "./utils.ts";
import type { Instance, Operation } from "./types.ts";

export async function getInstanceById(id: string): Promise<Instance> {
  if(!YC_INSTANCE_ID) {
    throw new Error(`No INSTANCE_ID`);
  }

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

async function probeWithRetries(url: string): Promise<boolean> {
  for (let i = 0; i < PROBE_RETRIES; i++) {
      try {
        const res = await fetch(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(PROBE_TIMEOUT_SECONDS * 1000),
          redirect: "manual", // любой 3xx тоже считаем «живой»
        });
        if (res.status > 0) {
          return true
        }
      } catch {
        await wait(200);
      }
  }
  return false;
}

async function main() {
  log(`Monitoring: ${YC_INSTANCE_ID}`);
  log(`Probe target: ${PROBE_URL}`);
  log(`Interval: ${PROBE_INTERVAL_SECONDS}s, timeout: ${PROBE_TIMEOUT_SECONDS}s, retries: ${PROBE_RETRIES}`);
  
  while (true) {
    let nextWaitMs = PROBE_INTERVAL_SECONDS * 1000;

    const shouldWakeup = !(await probeWithRetries(PROBE_URL));

    if (shouldWakeup) {
      log(
        `${PROBE_URL} (${YC_INSTANCE_ID}): probe failed after ${PROBE_RETRIES} retries`,
      );

      try {
        const instance = await getInstanceById(YC_INSTANCE_ID);
        if (["STOPPED", "ERROR", "CRASHED"].includes(instance.status)) {
          log(`Instance is ${instance.status}: sending start command…`);
          await startInstance(instance.id);
          nextWaitMs = 60 * 1000;
          log(`Recheck ${instance.status} in ${nextWaitMs / 1000} seconds`);
        } else {
          log(`Instance is ${instance.status}: no action required`);
        }
      } catch (e) {
        log(`${(e as Error).message}`);
      }
    } else {
      log(`${PROBE_URL} (${YC_INSTANCE_ID}) alive`);
    }

    await wait(nextWaitMs);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

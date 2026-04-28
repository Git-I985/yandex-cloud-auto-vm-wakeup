import { Session } from "@yandex-cloud/nodejs-sdk";
import { instanceService } from "@yandex-cloud/nodejs-sdk/compute-v1";
import { InstanceView } from "@yandex-cloud/nodejs-sdk/compute-v1/instance_service";

import { Instance_Status } from "@yandex-cloud/nodejs-sdk/compute-v1/instance";
import { YC_INSTANCE_ID, YC_OAUTH_TOKEN } from "./config";


export const RESTART_STATUSES = [
  Instance_Status.STOPPED,
  Instance_Status.ERROR,
  Instance_Status.CRASHED,
];

export const TRANSIENT_STATUSES = [
  Instance_Status.PROVISIONING,
  Instance_Status.STARTING,
  Instance_Status.STOPPING,
  Instance_Status.RESTARTING,
  Instance_Status.UPDATING,
];

export const checkInstance = async () => {
  try {
    const session = new Session({ oauthToken: YC_OAUTH_TOKEN });
    const instanceServiceClient = session.client(
      instanceService.InstanceServiceClient,
    );

    const state = await instanceServiceClient.get({
      instanceId: YC_INSTANCE_ID,
      view: InstanceView.FULL,
    });

    if (RESTART_STATUSES.includes(state.status)) {
      console.warn(`Instance ${YC_INSTANCE_ID} is ${state.status}, starting`);
      await instanceServiceClient.start({
        instanceId: YC_INSTANCE_ID,
      });
    } else {
      console.warn(`Instance ${YC_INSTANCE_ID} is ${state.status}`);
    }

  } catch (e) {
    console.error(e as Error);
  }
};

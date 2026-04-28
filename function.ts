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

const enumGetKeyByVal = (enumObj: any, enumValue: any) =>
  Object.keys(enumObj).find((k) => enumObj[k] === enumValue);

export const checkInstance = async () => {
  try {
    const session = new Session({ oauthToken: YC_OAUTH_TOKEN });
    const instanceServiceClient = session.client(
      instanceService.InstanceServiceClient,
    );

    const { status } = await instanceServiceClient.get({
      instanceId: YC_INSTANCE_ID,
      view: InstanceView.FULL,
    });

    const humanReadableStatus = enumGetKeyByVal(Instance_Status, status);

    if (RESTART_STATUSES.includes(status)) {
      console.warn(
        `Instance ${YC_INSTANCE_ID} is ${humanReadableStatus}, starting`,
      );
      await instanceServiceClient.start({
        instanceId: YC_INSTANCE_ID,
      });
    } else {
      console.warn(`Instance ${YC_INSTANCE_ID} is ${humanReadableStatus}`);
    }

  } catch (e) {
    console.error(e as Error);
  }
};

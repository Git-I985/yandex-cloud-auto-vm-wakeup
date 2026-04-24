// https://yandex.cloud/ru/docs/compute/api-ref/Instance/

export type InstanceStatus =
  | "STATUS_UNSPECIFIED"
  | "PROVISIONING"
  | "RUNNING"
  | "STOPPING"
  | "STOPPED"
  | "STARTING"
  | "RESTARTING"
  | "UPDATING"
  | "ERROR"
  | "CRASHED"
  | "DELETING";

export interface Instance {
  id: string;
  folderId: string;
  createdAt?: string;
  name?: string;
  description?: string;
  zoneId: string;
  status: InstanceStatus;
  networkInterfaces?: Array<{
    index: string;
    macAddress: string;
    subnetId: string;
    primaryV4Address?: {
      address: string;
      oneToOneNat?: { address: string; ipVersion: string };
    };
  }>;
}

export interface ListInstancesResponse {
  instances?: Instance[];
  nextPageToken?: string;
}

export interface Operation {
  id: string;
  description?: string;
  createdAt?: string;
  done: boolean;
  error?: { code: number; message: string };
  response?: unknown;
}

export interface IamTokenResponse {
  iamToken: string;
  expiresAt: string;
}

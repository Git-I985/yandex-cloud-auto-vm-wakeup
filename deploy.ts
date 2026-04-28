import { Session, waitForOperation } from "@yandex-cloud/nodejs-sdk";
import { functionService } from "@yandex-cloud/nodejs-sdk/serverless-functions-v1";
import { triggerService } from "@yandex-cloud/nodejs-sdk/serverless-triggers-v1";

import { required, YC_INSTANCE_ID, YC_OAUTH_TOKEN } from "./config";
import { readFile } from "fs/promises";

const YC_FOLDER_ID = required("YC_FOLDER_ID");
const YC_FUNCTION_NAME = "auto-vm-wakeup";
const YC_TRIGGER_NAME = `${YC_FUNCTION_NAME}-trigger`;
const YC_TRIGGER_CRON_EXPRESSION = "* * ? * * *";
const YC_FUNCTION_SOURCE_CODE_ZIP_PATH = "./build.zip";
const YC_FUNCTION_RUNTIME = "nodejs22";
const YC_FUNCTION_ENTRYPOINT = "function.checkInstance";

const serviceAccount = JSON.parse(
  await readFile("./key.json", { encoding: "utf8" }),
);
const session = new Session({
  serviceAccountJson: {
    serviceAccountId: serviceAccount.service_account_id,
    accessKeyId: serviceAccount.id,
    privateKey: serviceAccount.private_key,
  },
});
const functionsClient = session.client(functionService.FunctionServiceClient);
const triggersClient = session.client(triggerService.TriggerServiceClient);

// Create function if needed
const { functions } = await functionsClient.list(
  functionService.ListFunctionsRequest.fromPartial({
    folderId: YC_FOLDER_ID,
  }),
);

let functionId = functions.find((f) => f.name === YC_FUNCTION_NAME)?.id;

if (!functionId) {
  console.log(`Creating function "${YC_FUNCTION_NAME}"...`);
  const createFunctionOperation = await functionsClient.create(
    functionService.CreateFunctionRequest.fromPartial({
      folderId: YC_FOLDER_ID,
      name: YC_FUNCTION_NAME,
    }),
  );
  const finished = await waitForOperation(createFunctionOperation, session);
  if (!finished.metadata) {
    throw new Error("CreateFunction operation finished without metadata");
  }
  functionId = functionService.CreateFunctionMetadata.decode(
    finished.metadata.value,
  ).functionId;
  console.log(`Function created: ${functionId}`);
} else {
  console.log(`Function "${YC_FUNCTION_NAME}" already exists: ${functionId}`);
}

// Deploy new version
const content = await readFile(YC_FUNCTION_SOURCE_CODE_ZIP_PATH);
console.log(
  `Deploying new version from ${YC_FUNCTION_SOURCE_CODE_ZIP_PATH} (${content.byteLength} bytes)...`,
);
const versionCreateOperation = await functionsClient.createVersion(
  functionService.CreateFunctionVersionRequest.fromPartial({
    functionId,
    runtime: YC_FUNCTION_RUNTIME,
    entrypoint: YC_FUNCTION_ENTRYPOINT,
    resources: { memory: 128 * 1024 * 1024 },
    executionTimeout: { seconds: 5, nanos: 0 },
    content,
    serviceAccountId: serviceAccount.service_account_id,
    environment: {
      YC_OAUTH_TOKEN,
      YC_INSTANCE_ID,
    },
  }),
);
await waitForOperation(versionCreateOperation, session);

// Delete old versions
const exVersions = (
  await functionsClient.listVersions(
    functionService.ListFunctionsVersionsRequest.fromPartial({
      functionId,
    }),
  )
).versions.filter((v) => !v.tags.includes("$latest"));

const deleteExVersionOperations = await Promise.all(
  exVersions.map((exVersion) =>
    functionsClient.deleteVersion(
      functionService.DeleteFunctionVersionRequest.fromPartial({
        functionVersionId: exVersion.id,
      }),
    ),
  ),
);

console.log("Delete older (not $latest) versions");
console.table(
  exVersions.map(
    ({
      imageSize,
      tags,
      tmpfsSize,
      concurrency,
      namedServiceAccounts,
      secrets,
      storageMounts,
      mounts,
      resources,
      executionTimeout,
      logOptions,
      environment,
      ...toDisplay
    }) => toDisplay,
  ),
);

await Promise.all(
  deleteExVersionOperations.map((deleteExVersionOperation) =>
    waitForOperation(deleteExVersionOperation, session),
  ),
);

// Create trigger
const { triggers } = await triggersClient.list(
  triggerService.ListTriggersRequest.fromPartial({
    folderId: YC_FOLDER_ID,
  }),
);

if (triggers.some((t) => t.name === YC_TRIGGER_NAME)) {
  console.log(`Trigger ${YC_TRIGGER_NAME} already exists.`);
  process.exit(0);
}

const triggerOp = await triggersClient.create(
  triggerService.CreateTriggerRequest.fromPartial({
    folderId: YC_FOLDER_ID,
    name: YC_TRIGGER_NAME,
    rule: {
      timer: {
        cronExpression: YC_TRIGGER_CRON_EXPRESSION,
        invokeFunctionWithRetry: {
          functionId,
          serviceAccountId: serviceAccount.service_account_id,
        },
      },
    },
  }),
);
await waitForOperation(triggerOp, session);
console.log(`Trigger ${YC_TRIGGER_NAME} created`);

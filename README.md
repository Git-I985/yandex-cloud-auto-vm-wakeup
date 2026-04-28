# Yandex Cloud Compute auto wakeup VMs

Auto-restart for stopped VMs in Yandex Cloud Compute.

## Install deps

```bash
bun install
```

## Create a service account (if you don't have one) and grant permissions

```bash
yc iam service-account create $name

yc resource-manager folder add-access-binding $folderId \
  --role serverless.functions.admin \
  --subject "serviceAccount:$serviceAccountId"
yc resource-manager folder add-access-binding $folderId \
  --role compute.admin \
  --subject "serviceAccount:$serviceAccountId"
yc resource-manager folder add-access-binding $folderId \
  --role iam.serviceAccounts.user \
  --subject "serviceAccount:$serviceAccountId"
```

## Scenarios

### [Manual deploy](https://yandex.cloud/ru/docs/compute/tutorials/nodejs-cron-restart-vm#before-you-begin)

```bash
# ... log in to Yandex Cloud
# ... switch to the target folder
# ... create a service account (if you don't have one) and grant permissions
# Create the function definition
yc serverless function create ...
# Build the code
bun run build
# Deploy a new function version
yc serverless function version create ...
# Create a timer trigger (once)
yc serverless trigger create timer ...
```

### Automatic build and deploy

```bash
# ... log in to Yandex Cloud
# ... switch to the target folder
# ... create a service account (if you don't have one) and grant permissions
# Generate a key file
yc iam key create --output key.json --service-account-name $name
# Run build and deploy with env vars (can be set elsewhere, doesn't matter)
YC_OAUTH_KEY=... YC_INSTANCE_ID=... YC_FOLDER_ID=... bun run build-and-deploy
```

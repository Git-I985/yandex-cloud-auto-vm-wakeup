export const required = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Env var ${name} is required`);
  return v;
};

export const YC_INSTANCE_ID = required("YC_INSTANCE_ID");
export const YC_OAUTH_TOKEN = required("YC_OAUTH_TOKEN");

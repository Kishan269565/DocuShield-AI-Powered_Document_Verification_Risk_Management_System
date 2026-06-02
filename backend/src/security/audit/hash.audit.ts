import crypto from "crypto";

export const generateEventHash = (
  event: any
): string => {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(event))
    .digest("hex");
};

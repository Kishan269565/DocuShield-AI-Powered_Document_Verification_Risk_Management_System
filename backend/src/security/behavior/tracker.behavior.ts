import { storeBehaviorEvent } from "./store.behavior";
import { BehaviorEventType } from "./types.behavior";

export const trackRequest = async (req: any) => {
  await storeBehaviorEvent({
    type: BehaviorEventType.REQUEST,
    ip: req.ip ?? "0.0.0.0",
    userAgent: req.headers["user-agent"],
    userId: req.user?.id,
    metadata: {
      path: req.path,
      method: req.method,
    },
  });
};

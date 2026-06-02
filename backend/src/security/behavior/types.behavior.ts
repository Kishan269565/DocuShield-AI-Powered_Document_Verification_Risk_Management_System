export enum BehaviorEventType {
  LOGIN_ATTEMPT = "LOGIN_ATTEMPT",
  IP_CHANGE = "IP_CHANGE",
  REQUEST = "REQUEST",
  SENSITIVE_ACTION = "SENSITIVE_ACTION",
}

export interface BehaviorEvent {
  type: BehaviorEventType;
  ip: string;
  userId?: number;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

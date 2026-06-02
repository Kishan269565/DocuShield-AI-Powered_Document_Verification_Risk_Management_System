export enum DefenseAction {
  NONE = "NONE",
  LOCK_ACCOUNT = "LOCK_ACCOUNT",
  INVALIDATE_SESSION = "INVALIDATE_SESSION",
  FORCE_REVERIFY = "FORCE_REVERIFY",
}
export const allowAction = async () => {
  return {
    success: true,
    actionTaken: "ALLOW",
  };
};

export const challengeAction = async () => {
  // later: OTP, CAPTCHA, step-up auth
  return {
    success: true,
    actionTaken: "CHALLENGE_USER",
  };
};

export const escalateAction = async () => {
  // later: admin review, manual verification
  return {
    success: true,
    actionTaken: "ESCALATED_FOR_REVIEW",
  };
};

export const blockAction = async () => {
  // later: lock account, revoke tokens
  return {
    success: true,
    actionTaken: "BLOCKED",
  };
};

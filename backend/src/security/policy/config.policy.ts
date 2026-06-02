export const SecurityPolicy = {
  THRESHOLDS: {
    SAFE: 30,
    SUSPICIOUS: 70,
  },

  ACTIONS: {
    SAFE: "NONE",
    SUSPICIOUS: "FORCE_REVERIFY",
    DANGEROUS: "LOCK_ACCOUNT",
  },
};

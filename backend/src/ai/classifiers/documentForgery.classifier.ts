export type ForgeryResult = {
  suspectedForgery: boolean;
  indicators: string[];
};

export const detectForgerySignals = (
  containsSensitive: boolean,
  isBlurry?: boolean,
  possibleForgery?: boolean
): ForgeryResult => {
  const indicators: string[] = [];

  if (containsSensitive && isBlurry) {
    indicators.push("Sensitive data with poor image quality");
  }

  if (possibleForgery) {
    indicators.push("Image metadata anomaly");
  }

  return {
    suspectedForgery: indicators.length > 0,
    indicators,
  };
};

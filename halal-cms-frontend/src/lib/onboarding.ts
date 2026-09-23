export const ONBOARDING_KEY = "hcs_onboarding_complete"
export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "true"
}

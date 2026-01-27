const INTERVIEW_COOLDOWN_KEY = 'interai_interview_cooldown';
const COOLDOWN_DURATION = 24 * 60 * 60 * 1000;

export const setInterviewCooldown = () => {
  if (typeof window !== 'undefined') {
    const timestamp = Date.now();
    localStorage.setItem(INTERVIEW_COOLDOWN_KEY, timestamp.toString());
  }
};

export const getInterviewCooldown = (): number | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(INTERVIEW_COOLDOWN_KEY);
  if (!stored) return null;
  return parseInt(stored, 10);
};

export const clearInterviewCooldown = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(INTERVIEW_COOLDOWN_KEY);
  }
};

export const isInterviewOnCooldown = (): boolean => {
  const timestamp = getInterviewCooldown();
  if (!timestamp) return false;
  const elapsed = Date.now() - timestamp;
  return elapsed < COOLDOWN_DURATION;
};

export const getRemainingTime = (): number => {
  const timestamp = getInterviewCooldown();
  if (!timestamp) return 0;
  const elapsed = Date.now() - timestamp;
  const remaining = COOLDOWN_DURATION - elapsed;
  return Math.max(0, remaining);
};

export const formatRemainingTime = (ms: number): { days: number; hours: number; minutes: number; seconds: number } => {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

import { useAuthStore } from '@/store/authStore';

export const recordActivity = (action: string, detail?: string) => {
  useAuthStore.getState().appendLog(action, detail);
};


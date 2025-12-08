'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';
import { signInWithPin, signOut, getProfile } from '@/lib/supabaseAuthClient';

export type UserRole = 'admin' | 'user';

export interface UserAccount {
  id: string;
  name: string; // 로그인 ID로 사용
  phoneLast4: string;
  password: string; // 4자리 PIN
  mustChangePassword?: boolean;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  userId: string;
  name: string;
  role: UserRole;
  loggedInAt: string;
  mustChangePassword: boolean;
}

export interface ActivityLog {
  id: string;
  actorName: string;
  actorRole: UserRole | 'guest';
  action: string;
  detail?: string;
  timestamp: string;
}

interface AuthState {
  users: UserAccount[];
  session?: UserSession;
  logs: ActivityLog[];
  login: (name: string, password: string) => Promise<{ ok: boolean; message?: string; requiresPasswordChange?: boolean }>;
  logout: () => Promise<void>;
  setSession: (session?: UserSession) => void;
  upsertUser: (input: {
    id?: string;
    name: string;
    phoneLast4: string;
    password?: string;
    role: UserRole;
    active?: boolean;
  }) => { ok: boolean; message?: string; user?: UserAccount };
  setUserActive: (userId: string, active: boolean) => void;
  changePassword: (userId: string, newPassword: string) => Promise<{ ok: boolean; message?: string }>;
  appendLog: (
    action: string,
    detail?: string,
    actorOverride?: { name: string; role: UserRole | 'guest' }
  ) => void;
}

const sanitizePhoneLast4 = (value: string) => value.replace(/\D/g, '').slice(-4);
const sanitizePin6 = (value: string) => value.replace(/\D/g, '').slice(0, 6);
const normalizeName = (value: string) => value.trim();

const seedTimestamp = new Date().toISOString();
const SEED_USERS: UserAccount[] = [
  {
    id: 'admin-main',
    name: '관리자',
    phoneLast4: '8642',
    password: '8642',
    mustChangePassword: true,
    role: 'admin',
    active: true,
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
  },
  {
    id: 'user-1',
    name: '일반유저',
    phoneLast4: '1111',
    password: '1111',
    mustChangePassword: true,
    role: 'user',
    active: true,
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
  },
];

const buildSession = (user: UserAccount, mustChangePassword: boolean): UserSession => ({
  userId: user.id,
  name: user.name,
  role: user.role,
  loggedInAt: new Date().toISOString(),
  mustChangePassword,
});

const createLogEntry = (
  action: string,
  detail: string | undefined,
  actorName: string,
  actorRole: UserRole | 'guest'
): ActivityLog => ({
  id: crypto.randomUUID(),
  actorName,
  actorRole,
  action,
  detail,
  timestamp: new Date().toISOString(),
});

const LOG_LIMIT = 300;

const normalizeUser = (user: UserAccount): UserAccount => {
  const password = user.password ? sanitizePhoneLast4(user.password) : sanitizePhoneLast4(user.phoneLast4);
  return {
    ...user,
    password: password.length === 4 ? password : '0000',
    mustChangePassword: user.mustChangePassword ?? true,
    active: user.active ?? true,
    createdAt: user.createdAt ?? new Date().toISOString(),
    updatedAt: user.updatedAt ?? new Date().toISOString(),
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: SEED_USERS.map(normalizeUser),
      session: undefined,
      logs: [],

      login: async (rawName, rawPassword) => {
        const name = normalizeName(rawName);
        const password = sanitizePin6(rawPassword);

        if (!name || password.length !== 6) {
          return { ok: false, message: '비밀번호는 숫자 6자리여야 합니다.' };
        }

        const { error: signInError } = await signInWithPin(name, password);
        if (signInError) {
          return { ok: false, message: signInError.message ?? '로그인에 실패했습니다.' };
        }

        const { profile, error } = await getProfile();
        if (error || !profile) {
          return { ok: false, message: '프로필 조회에 실패했습니다.' };
        }

        const session = buildSession(
          {
            id: profile.id,
            name: profile.name,
            phoneLast4: profile.phone_last4,
            password,
            mustChangePassword: profile.must_change_password,
            role: profile.role,
            active: profile.active,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
          },
          profile.must_change_password
        );
        set({ session });
        get().appendLog('auth.login', `${profile.name} 로그인`, {
          name: profile.name,
          role: profile.role,
        });
        return { ok: true, requiresPasswordChange: profile.must_change_password };
      },

      logout: async () => {
        const current = get().session;
        await signOut();
        set({ session: undefined });
        if (current) {
          get().appendLog('auth.logout', `${current.name} 로그아웃`, {
            name: current.name,
            role: current.role,
          });
        }
      },

      setSession: (session) => set({ session }),

      upsertUser: (input) => {
        const name = normalizeName(input.name);
        const phoneLast4 = sanitizePhoneLast4(input.phoneLast4);
        if (!name) return { ok: false, message: '이름은 필수입니다.' };
        if (phoneLast4.length !== 4) return { ok: false, message: '휴대폰 번호 뒷자리는 4자여야 합니다.' };
        const password = input.password ? sanitizePhoneLast4(input.password) : phoneLast4;
        if (password.length !== 4) return { ok: false, message: '비밀번호는 숫자 4자리여야 합니다.' };

        const now = new Date().toISOString();
        const { users } = get();
        const existsById = input.id ? users.find((u) => u.id === input.id) : undefined;
        const existsByName = users.find((u) => normalizeName(u.name) === name);

        if (!existsById && existsByName && existsByName.id !== input.id) {
          return { ok: false, message: '동일한 이름(ID)의 사용자가 이미 존재합니다.' };
        }

        let updatedUser: UserAccount;
        let newUsers: UserAccount[];

        if (existsById) {
          updatedUser = {
            ...existsById,
            name,
            phoneLast4,
            password,
            mustChangePassword: input.password ? true : existsById.mustChangePassword,
            role: input.role,
            active: input.active ?? existsById.active,
            updatedAt: now,
          };
          newUsers = users.map((u) => (u.id === existsById.id ? updatedUser : u));
        } else {
          updatedUser = {
            id: crypto.randomUUID(),
            name,
            phoneLast4,
            password,
            mustChangePassword: true,
            role: input.role,
            active: input.active ?? true,
            createdAt: now,
            updatedAt: now,
          };
          newUsers = [...users, updatedUser];
        }

        set({ users: newUsers });

        const action = existsById ? 'user.updated' : 'user.created';
        const detail = `${updatedUser.name} (${updatedUser.role}) ${existsById ? '수정' : '생성'}`;
        get().appendLog(action, detail);

        return { ok: true, user: updatedUser };
      },

      setUserActive: (userId, active) => {
        const { users } = get();
        const target = users.find((u) => u.id === userId);
        if (!target) return;
        const updated: UserAccount = { ...target, active, updatedAt: new Date().toISOString() };
        set({ users: users.map((u) => (u.id === userId ? updated : u)) });
        get().appendLog('user.status', `${updated.name} ${active ? '활성화' : '비활성화'}`);
      },

      changePassword: async (_userId, newPassword) => {
        const normalized = sanitizePin6(newPassword);
        if (normalized.length !== 6) {
          return { ok: false, message: '비밀번호는 숫자 6자리여야 합니다.' };
        }
        const { session } = get();
        if (!session) return { ok: false, message: '로그인이 필요합니다.' };

        let { data: sessionData } = await supabase.auth.getSession();
        let token = sessionData.session?.access_token;
        if (!token) {
          // 세션 만료 시 갱신 시도
          const refreshed = await supabase.auth.refreshSession();
          sessionData = refreshed.data;
          token = sessionData.session?.access_token;
        }
        if (!token) return { ok: false, message: '로그인이 필요합니다.' };

        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ pin: normalized }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          return { ok: false, message: json.error || '비밀번호 변경에 실패했습니다.' };
        }

        set({
          session: { ...session, mustChangePassword: false },
        });
        get().appendLog('auth.password_change', `${session.name} 비밀번호 변경`);
        return { ok: true };
      },

      appendLog: (action, detail, actorOverride) => {
        const { session, logs } = get();
        const actorName = actorOverride?.name ?? session?.name ?? '익명';
        const actorRole = actorOverride?.role ?? session?.role ?? 'guest';
        const entry = createLogEntry(action, detail, actorName, actorRole);
        const nextLogs = [entry, ...logs].slice(0, LOG_LIMIT);
        set({ logs: nextLogs });
      },
    }),
    {
      name: 'lecture-auth-store',
      skipHydration: false,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('authStore 복원 실패:', error);
        }
        if (state) {
          if (state.users && state.users.length === 0) {
            state.users = SEED_USERS;
          }
          if (state.users) {
            state.users = state.users.map(normalizeUser);
          }
        }
      },
      partialize: (state) => ({
        users: state.users,
        session: state.session,
        logs: state.logs,
      }),
    }
  )
);

// 전역에서 편하게 사용할 수 있는 Activity 로거 헬퍼
export const logActivity = (action: string, detail?: string) => {
  useAuthStore.getState().appendLog(action, detail);
};


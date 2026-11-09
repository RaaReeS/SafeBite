import type { Session } from "@supabase/supabase-js";

/**
 * Supabase simulado para los tests de pantallas. Uso en cada archivo de test:
 *   jest.mock("@/lib/supabase", () => require("@/test-utils/supabase-mock").supabaseModule);
 */

type AuthListener = (event: string, session: Session | null) => void;
const listeners = new Set<AuthListener>();

export const mockAuth = {
  getSession: jest.fn(async () => ({ data: { session: null as Session | null }, error: null })),
  onAuthStateChange: jest.fn((listener: AuthListener) => {
    listeners.add(listener);
    return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
  }),
  signUp: jest.fn(),
  verifyOtp: jest.fn(),
  resend: jest.fn(),
  signInWithPassword: jest.fn(),
  resetPasswordForEmail: jest.fn(),
  updateUser: jest.fn(),
  signOut: jest.fn(async () => ({ error: null })),
};

export const supabaseModule = { supabase: { auth: mockAuth } };

export function fakeSession(email = "comensal@safebite.test"): Session {
  return {
    access_token: "token",
    refresh_token: "refresh",
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: "00000000-0000-0000-0000-000000000001",
      email,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date(0).toISOString(),
    },
  };
}

/** Simula un cambio de sesión emitido por Supabase (login, logout, verificación). */
export function emitSession(session: Session | null) {
  for (const listener of listeners)
    listener(session === null ? "SIGNED_OUT" : "SIGNED_IN", session);
}

export function resetSupabaseMock() {
  listeners.clear();
  for (const fn of Object.values(mockAuth)) fn.mockClear();
  mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
}

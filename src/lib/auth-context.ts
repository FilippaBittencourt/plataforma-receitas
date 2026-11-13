import { createContext } from "react";
import type { Account } from "@/lib/mock-data";

export type AuthResult =
  { ok: true; user: Account; recoveryCode?: string } | { ok: false; error: string };

export type AuthContextValue = {
  ready: boolean;
  user: Account | null;
  pendingRecoveryCode: string | null;
  dismissRecoveryCode: () => void;
  signedInAccounts: Account[];
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (data: { name: string; email: string; password: string }) => Promise<AuthResult>;
  logout: () => void;
  switchAccount: (id: string) => void;
  updateUser: (patch: Partial<Omit<Account, "id" | "role">>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  emailInUse: (email: string) => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

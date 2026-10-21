import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { demoAccounts, type Account } from "@/lib/mock-data";

// Sessão simulada: o protótipo não tem backend, então contas e sessão ficam no localStorage.
const STORAGE_KEY = "cookie:sessao";

type SessionState = {
  accounts: Account[];
  signedInIds: string[];
  activeId: string | null;
};

type AuthResult = { ok: true; user: Account } | { ok: false; error: string };

type AuthContextValue = {
  ready: boolean;
  user: Account | null;
  signedInAccounts: Account[];
  login: (email: string) => AuthResult;
  signup: (data: { name: string; email: string }) => AuthResult;
  logout: () => void;
  switchAccount: (id: string) => void;
  updateUser: (patch: Partial<Omit<Account, "id" | "role">>) => void;
  deleteAccount: () => void;
  emailInUse: (email: string) => boolean;
};

const initialState: SessionState = { accounts: demoAccounts, signedInIds: [], activeId: null };

const AuthContext = createContext<AuthContextValue | null>(null);

function readStorage(): SessionState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as SessionState;
    if (!Array.isArray(parsed.accounts) || !Array.isArray(parsed.signedInIds)) return initialState;
    return parsed;
  } catch {
    return initialState;
  }
}

function writeStorage(state: SessionState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sem armazenamento (aba anônima, bloqueio): a sessão vale só até recarregar.
  }
}

function handleFrom(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return `@${slug || "cozinheiro"}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(readStorage());
    setReady(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: SessionState) => {
    setState(next);
    writeStorage(next);
  }, []);

  const signIn = useCallback(
    (current: SessionState, account: Account, accounts = current.accounts): SessionState => ({
      accounts,
      signedInIds: current.signedInIds.includes(account.id)
        ? current.signedInIds
        : [...current.signedInIds, account.id],
      activeId: account.id,
    }),
    [],
  );

  const login = useCallback(
    (email: string): AuthResult => {
      const normalized = email.trim().toLowerCase();
      const account = state.accounts.find((a) => a.email.toLowerCase() === normalized);
      if (!account) return { ok: false, error: "Não encontramos uma conta com este e-mail." };
      commit(signIn(state, account));
      return { ok: true, user: account };
    },
    [state, commit, signIn],
  );

  const signup = useCallback(
    ({ name, email }: { name: string; email: string }): AuthResult => {
      const normalized = email.trim().toLowerCase();
      if (state.accounts.some((a) => a.email.toLowerCase() === normalized)) {
        return { ok: false, error: "Já existe uma conta com este e-mail." };
      }
      const account: Account = {
        id: `u-${Date.now().toString(36)}`,
        name: name.trim(),
        handle: handleFrom(name),
        email: normalized,
        bio: "",
        since: `Membro desde ${new Date().getFullYear()}`,
        role: "membro",
        stats: { publicadas: 0, avaliacoes: 0, testadas: 0, seguidores: 0 },
        publishedIds: [],
        testedIds: [],
        notifications: { avaliacoes: true, comentarios: true, novidades: false },
      };
      commit(signIn(state, account, [...state.accounts, account]));
      return { ok: true, user: account };
    },
    [state, commit, signIn],
  );

  const logout = useCallback(() => {
    commit({ ...state, signedInIds: [], activeId: null });
  }, [state, commit]);

  const switchAccount = useCallback(
    (id: string) => {
      if (!state.signedInIds.includes(id)) return;
      commit({ ...state, activeId: id });
    },
    [state, commit],
  );

  const updateUser = useCallback(
    (patch: Partial<Omit<Account, "id" | "role">>) => {
      if (!state.activeId) return;
      commit({
        ...state,
        accounts: state.accounts.map((a) => (a.id === state.activeId ? { ...a, ...patch } : a)),
      });
    },
    [state, commit],
  );

  const deleteAccount = useCallback(() => {
    if (!state.activeId) return;
    const id = state.activeId;
    commit({
      accounts: state.accounts.filter((a) => a.id !== id),
      signedInIds: state.signedInIds.filter((x) => x !== id),
      activeId: null,
    });
  }, [state, commit]);

  const value = useMemo<AuthContextValue>(() => {
    const byId = (id: string) => state.accounts.find((a) => a.id === id);
    return {
      ready,
      user: state.activeId ? (byId(state.activeId) ?? null) : null,
      signedInAccounts: state.signedInIds.map(byId).filter((a): a is Account => Boolean(a)),
      login,
      signup,
      logout,
      switchAccount,
      updateUser,
      deleteAccount,
      emailInUse: (email) => {
        const normalized = email.trim().toLowerCase();
        return state.accounts.some(
          (a) => a.id !== state.activeId && a.email.toLowerCase() === normalized,
        );
      },
    };
  }, [state, ready, login, signup, logout, switchAccount, updateUser, deleteAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}

// Só aceita caminhos internos, para o ?redirect= não virar redirecionamento aberto.
export function safeRedirect(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : undefined;
}

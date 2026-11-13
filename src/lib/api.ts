const API_URL = (import.meta.env["VITE_API_URL"] || "http://localhost:8080").replace(/\/$/, "");
const TOKEN_KEY = "cookie:token";

export type ApiUser = {
  id: number;
  nome: string;
  nomeUsuario: string;
  email: string;
  bio: string | null;
  fotoPerfil: string | null;
  tipo: "USUARIO" | "ADMINISTRADOR";
  status: string;
  dataCadastro: string;
  notificacoes: { avaliacoes: boolean; comentarios: boolean; novidades: boolean };
  estatisticas: { receitasPublicadas: number; avaliacoes: number };
};

export function getToken() {
  return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
}
export function saveToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      `Não foi possível conectar à API (${API_URL}). Verifique se o backend está ativo.`,
    );
  }
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      detail?: string;
      message?: string;
      campos?: Record<string, string>;
    } | null;
    throw new Error(
      data?.detail ||
        data?.message ||
        (data?.campos && Object.values(data.campos).join(" ")) ||
        `Falha na API (${response.status}).`,
    );
  }
  if (response.status === 204 || response.status === 202) return undefined as T;
  return response.json() as Promise<T>;
}

export const apiUrl = (path: string | null | undefined) =>
  path ? (/^https?:\/\//.test(path) ? path : `${API_URL}${path}`) : "";

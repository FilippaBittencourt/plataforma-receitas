const API_URL = (import.meta.env["VITE_API_URL"] || "http://localhost:8080").replace(/\/$/, "");
let activeSessionId: string | null = null;

export function setActiveSessionId(id: string | null) {
  activeSessionId = id;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

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
  estatisticas: {
    receitasPublicadas: number;
    avaliacoes: number;
    receitasTestadas: number;
    seguidores?: number;
    seguindo?: number;
  };
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (activeSessionId && !headers.has("X-Session-Id")) headers.set("X-Session-Id", activeSessionId);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
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
    throw new ApiError(
      data?.detail ||
        data?.message ||
        (data?.campos && Object.values(data.campos).join(" ")) ||
        `Falha na API (${response.status}).`,
      response.status,
    );
  }
  if (response.status === 204 || response.status === 202) return undefined as T;
  return response.json() as Promise<T>;
}

export const apiUrl = (path: string | null | undefined) =>
  path ? (/^https?:\/\//.test(path) ? path : `${API_URL}${path}`) : "";

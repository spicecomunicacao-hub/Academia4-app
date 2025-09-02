import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Tentar extrair mensagem de erro JSON primeiro
      const errorData = await res.json();
      throw new Error(errorData.message || res.statusText);
    } catch (jsonError) {
      // Se não for JSON válido, usar texto simples
      const text = res.statusText || `Erro ${res.status}`;
      throw new Error(text);
    }
  }
}

// Detectar se está rodando no Netlify e configurar URL base da API
function getApiBaseUrl(): string {
  // Se estiver rodando no Netlify (hostname contém .netlify.app), usar URL do servidor Replit
  if (typeof window !== 'undefined' && window.location.hostname.includes('.netlify.app')) {
    // URL do servidor Replit atualizada
    return 'https://4ee4b517-5986-4d32-b212-cf70e21a4258-00-36wb1et76ifou.janeway.replit.dev';
  }
  // Se estiver rodando localmente no Replit, usar URL relativa
  return '';
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const fullUrl = baseUrl + url;
  
  console.log('🌐 API Request:', { method, url, fullUrl, isNetlify: baseUrl !== '' });
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "omit", // Sempre omitir credentials para evitar problemas de CORS
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiBaseUrl();
    const url = baseUrl + queryKey.join("/");
    
    console.log('🔍 Query Request:', { queryKey, url, isNetlify: baseUrl !== '' });
    
    const res = await fetch(url, {
      credentials: "omit", // Sempre omitir credentials para evitar problemas de CORS
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

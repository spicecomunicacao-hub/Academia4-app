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
    // URL do servidor Replit
    return 'https://04ed240b-55dc-45ff-b07d-55b9711aa06c-00-olz8c44mabmr.riker.replit.dev';
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
    credentials: baseUrl === '' ? "include" : "omit", // Use include apenas localmente
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
      credentials: baseUrl === '' ? "include" : "omit",
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

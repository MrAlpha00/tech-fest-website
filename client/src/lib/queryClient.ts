import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Module-level CSRF token storage
let csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  retryOn403 = true,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add CSRF token to all mutating requests if available
  if (csrfToken && method !== "GET") {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  // Handle CSRF token expiration - fetch new token and retry once
  if (res.status === 403 && retryOn403 && method !== "GET") {
    try {
      // Fetch fresh CSRF token
      const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" });
      if (csrfRes.ok) {
        const { csrfToken: newToken } = await csrfRes.json();
        setCsrfToken(newToken);
        // Retry the original request with new token (no retry on second attempt)
        return apiRequest(method, url, data, false);
      }
    } catch (error) {
      // If token refresh fails, throw the original 403 error
      console.error("CSRF token refresh failed:", error);
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
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

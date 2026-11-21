import { TOKEN_KEY } from "../constants/listing";

type RefreshResponse = {
  access_token: string;
  token_type: string;
};

let refreshPromise: Promise<string | null> | null = null;

function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

function saveToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        clearStoredToken();
        return null;
      }

      const data: RefreshResponse = await response.json();

      if (!data.access_token) {
        clearStoredToken();
        return null;
      }

      saveToken(data.access_token);
      return data.access_token;
    } catch {
      clearStoredToken();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  let token = getStoredToken();

  if (!token) {
    token = await refreshAccessToken();
  }

  if (!token) {
    return new Response(
      JSON.stringify({
        detail: "Your session has expired. Please log in again.",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const requestInit: RequestInit = {
    ...init,
    headers,
    credentials: "same-origin",
  };

  const response = await fetch(input, requestInit);

  if (response.status !== 401) {
    return response;
  }

  // Reuse a newer token if another request already refreshed it.
  let newToken = getStoredToken();

  if (!newToken || newToken === token) {
    newToken = await refreshAccessToken();
  }

  if (!newToken) {
    return response;
  }

  // Retry the original request only once.
  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${newToken}`);

  return fetch(input, {
    ...init,
    headers: retryHeaders,
    credentials: "same-origin",
  });
}

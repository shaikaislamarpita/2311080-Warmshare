export function registerUser(
  fullName: string,
  email: string,
  password: string
): Promise<Response> {
  return fetch("/api/auth/register", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name: fullName,
      email: email,
      password: password,
    }),
  });
}

export function loginUser(
  email: string,
  password: string
): Promise<Response> {
  return fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: password,
    }),
  });
}

export function getCurrentUser(token: string): Promise<Response> {
  return fetch("/api/auth/me", {
    credentials: "same-origin",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function logoutUser(): Promise<Response> {
  return fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });
}

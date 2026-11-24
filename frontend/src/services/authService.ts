
import { authenticatedFetch } from "./api";

// ========================================
// USER REGISTRATION
// ========================================

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

// ========================================
// USER LOGIN
// ========================================

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
      email,
      password,
    }),
  });
}

// ========================================
// GET CURRENT USER PROFILE
// ========================================

export function getCurrentUser(token: string): Promise<Response> {
  return fetch("/api/auth/me", {
    credentials: "same-origin",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ========================================
// UPDATE CURRENT USER PROFILE
// PATCH /api/auth/me
// ========================================

export function updateMyProfile(
  fullName: string
): Promise<Response> {
  return authenticatedFetch("/api/auth/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name: fullName,
    }),
  });
}

// ========================================
// CHANGE CURRENT USER PASSWORD
// POST /api/auth/change-password
// ========================================

export function changeMyPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<Response> {
  return authenticatedFetch("/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
}

// ========================================
// USER LOGOUT
// ========================================

export function logoutUser(): Promise<Response> {
  return fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });
}

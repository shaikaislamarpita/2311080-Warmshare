
import type { FormEvent, MouseEvent } from "react";
import type { AuthMode } from "../../types/auth";

type AuthModalProps = {
  authMode: AuthMode | null;
  authName: string;
  authEmail: string;
  authPassword: string;
  authBusy: boolean;
  authError: string;
  setAuthName: (value: string) => void;
  setAuthEmail: (value: string) => void;
  setAuthPassword: (value: string) => void;
  closeAuth: () => void;
  openAuth: (mode: AuthMode) => void;
  handleAuth: (event: FormEvent<HTMLFormElement>) => void;
};

export default function AuthModal({
  authMode,
  authName,
  authEmail,
  authPassword,
  authBusy,
  authError,
  setAuthName,
  setAuthEmail,
  setAuthPassword,
  closeAuth,
  openAuth,
  handleAuth,
}: AuthModalProps) {
  function handleOverlayMouseDown(
    event: MouseEvent<HTMLDivElement>
  ) {
    if (
      event.target === event.currentTarget &&
      !authBusy
    ) {
      closeAuth();
    }
  }

  if (!authMode) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={handleOverlayMouseDown}
    >
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <div className="auth-heading">
          <div>
            <span className="section-label">
              WARMSHARE ACCOUNT
            </span>

            <h2 id="auth-title">
              {authMode === "register"
                ? "Create an Account"
                : "Welcome Back"}
            </h2>

            <p>
              {authMode === "register"
                ? "Join the community and share warmth."
                : "Log in to your WarmShare account."}
            </p>
          </div>

          <button
            type="button"
            className="auth-close"
            aria-label="Close"
            disabled={authBusy}
            onClick={closeAuth}
          >
            ×
          </button>
        </div>

        {authError && (
          <div className="alert alert-error" role="alert">
            {authError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleAuth}>
          {authMode === "register" && (
            <div className="form-group">
              <label htmlFor="auth-name">
                Full Name
              </label>

              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
                value={authName}
                onChange={(event) =>
                  setAuthName(event.target.value)
                }
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">
              Email Address
            </label>

            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              maxLength={255}
              required
              value={authEmail}
              onChange={(event) =>
                setAuthEmail(event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">
              Password
            </label>

            <input
              id="auth-password"
              type="password"
              autoComplete={
                authMode === "register"
                  ? "new-password"
                  : "current-password"
              }
              minLength={
                authMode === "register" ? 8 : undefined
              }
              maxLength={128}
              required
              value={authPassword}
              onChange={(event) =>
                setAuthPassword(event.target.value)
              }
            />

            {authMode === "register" && (
              <small>
                Password must contain at least 8 characters.
              </small>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={authBusy}
          >
            {authBusy
              ? "Please wait..."
              : authMode === "register"
              ? "Create Account"
              : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          {authMode === "register"
            ? "Already have an account?"
            : "New to WarmShare?"}
          {" "}

          <button
            type="button"
            disabled={authBusy}
            onClick={() =>
              openAuth(
                authMode === "register"
                  ? "login"
                  : "register"
              )
            }
          >
            {authMode === "register"
              ? "Login"
              : "Register"}
          </button>
        </p>
      </section>
    </div>
  );
}


import type { AuthUser, AuthMode } from "../../types/auth";

type NavbarProps = {
  checkingSession: boolean;
  authUser: AuthUser | null;
  logout: () => void;
  openAuth: (mode: AuthMode) => void;
  openCreateForm: () => void;
};

export default function Navbar({
  checkingSession,
  authUser,
  logout,
  openAuth,
  openCreateForm,
}: NavbarProps) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <a className="logo" href="#home">
          <span className="logo-icon">♥</span>
          WarmShare
        </a>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#donations">Donations</a>
        </nav>

        <div className="nav-actions">
          {checkingSession ? (
            <span className="auth-loading">
              Checking account...
            </span>
          ) : authUser ? (
            <>
              <div className="user-profile">
                <span className="user-avatar">
                  {authUser.full_name.charAt(0).toUpperCase()}
                </span>

                <div className="user-info">
                  <strong>{authUser.full_name}</strong>
                  <small>{authUser.email}</small>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => openAuth("login")}
              >
                Login
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openAuth("register")}
              >
                Register
              </button>
            </>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateForm}
            disabled={checkingSession}
          >
            + Add Donation
          </button>
        </div>
      </div>
    </header>
  );
}

import type { AuthUser, AuthMode } from "../../types/auth";

type NavbarProps = {
  checkingSession: boolean;
  authUser: AuthUser | null;
  logout: () => void;
  openAuth: (mode: AuthMode) => void;
  openCreateForm: () => void;
  openDashboard: () => void;
  goHome: () => void;
};

export default function Navbar({
  checkingSession,
  authUser,
  logout,
  openAuth,
  openCreateForm,
  openDashboard,
  goHome,
}: NavbarProps) {
  return (
    <header className="navbar">
      <div className="nav-container">

        {/* WARMSHARE LOGO */}

        <a
          className="logo"
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            goHome();
          }}
        >
          <span className="logo-icon">{"\u2665"}</span>
          WarmShare
        </a>

        {/* NAVIGATION ACTIONS */}

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
                onClick={openDashboard}
              >
                {authUser.role === "admin"
                  ? "Admin Dashboard"
                  : authUser.role === "moderator"
                    ? "Moderator Dashboard"
                    : "My Dashboard"}
              </button>

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
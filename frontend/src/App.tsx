
import { useEffect, useState, type FormEvent } from "react";

type Listing = {
  id: number;
  title: string;
  category: string;
  size: string;
  age_group: string;
  gender: string;
  condition: string;
  quantity: number;
  pickup_address: string;
  owner_id: number | null;
};

type ListingForm = Omit<Listing, "id" | "owner_id">;

type AuthUser = {
  id: number;
  full_name: string;
  email: string;
  role: string;
};

type AuthMode = "login" | "register";

const TOKEN_KEY = "warmshare_access_token";

const emptyForm: ListingForm = {
  title: "",
  category: "jacket",
  size: "M",
  age_group: "adult",
  gender: "unisex",
  condition: "good",
  quantity: 1,
  pickup_address: "",
};

const categories = [
  "jacket",
  "sweater",
  "blanket",
  "shawl",
  "socks",
];

const categoryEmojis: Record<string, string> = {
  jacket: "🧥",
  sweater: "🧶",
  blanket: "🛏️",
  shawl: "🧣",
  socks: "🧦",
};

function formatText(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item: { msg?: string }) => item.msg || "Invalid input")
        .join(", ");
    }
  } catch {
    // Handle non-JSON responses.
  }

  return `Request failed (${response.status})`;
}

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [form, setForm] = useState<ListingForm>({ ...emptyForm });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Authentication
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Restore login when the browser refreshes.
  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
      setCheckingSession(false);
      return;
    }

    fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Invalid session");
        }

        const user: AuthUser = await response.json();
        setAuthUser(user);
      })
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setAuthUser(null);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  // Load donations.
  useEffect(() => {
    void loadListings();
  }, []);

  function scrollToSection(id: string) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }

  // Check whether the logged-in user owns a donation.
  function isOwner(listing: Listing): boolean {
    return (
      authUser !== null &&
      listing.owner_id !== null &&
      listing.owner_id === authUser.id
    );
  }

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");
    setAuthError("");
    setMessage("");
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);

    setAuthUser(null);
    setAuthMode(null);
    setShowForm(false);
    setEditingId(null);
    setDeleteTarget(null);

    setMessage("You have logged out successfully.");
    setError("");
  }

  // Handle registration and login.
  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authMode) return;

    setAuthBusy(true);
    setAuthError("");

    try {
      if (authMode === "register") {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: authName,
            email: authEmail,
            password: authPassword,
          }),
        });

        if (!registerResponse.ok) {
          throw new Error(await readError(registerResponse));
        }
      }

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error(await readError(loginResponse));
      }

      const loginData: {
        access_token: string;
        token_type: string;
      } = await loginResponse.json();

      const profileResponse = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${loginData.access_token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error(await readError(profileResponse));
      }

      const user: AuthUser = await profileResponse.json();

      sessionStorage.setItem(TOKEN_KEY, loginData.access_token);

      setAuthUser(user);
      setAuthMode(null);
      setAuthPassword("");
      setError("");

      setMessage(
        authMode === "register"
          ? "Account created successfully!"
          : `Welcome back, ${user.full_name}!`
      );
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Authentication failed"
      );
    } finally {
      setAuthBusy(false);
    }
  }

  // Load all donation listings.
  async function loadListings() {
    setLoading(true);

    try {
      const response = await fetch("/api/listings");

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data: Listing[] = await response.json();
      setListings(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load donations"
      );
    } finally {
      setLoading(false);
    }
  }

  // Open the donation form.
  function openCreateForm() {
    if (checkingSession) return;

    if (!authUser) {
      setError("");
      openAuth("login");
      return;
    }

    setForm({ ...emptyForm });
    setEditingId(null);
    setSelectedListing(null);
    setShowForm(true);
    setError("");
    setMessage("");

    scrollToSection("donation-form");
  }

  // Only the owner can open the edit form.
  function openEditForm(listing: Listing) {
    if (!isOwner(listing)) {
      setError("You can only edit donations created by your account.");
      return;
    }

    setForm({
      title: listing.title,
      category: listing.category,
      size: listing.size,
      age_group: listing.age_group,
      gender: listing.gender,
      condition: listing.condition,
      quantity: listing.quantity,
      pickup_address: listing.pickup_address,
    });

    setEditingId(listing.id);
    setSelectedListing(null);
    setShowForm(true);
    setError("");
    setMessage("");

    scrollToSection("donation-form");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function updateForm(
    field: keyof ListingForm,
    value: string | number
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // Create or update a donation using JWT authentication.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!authUser || !token) {
      closeForm();
      openAuth("login");
      return;
    }

    if (editingId !== null) {
      const existingListing = listings.find(
        (listing) => listing.id === editingId
      );

      if (!existingListing || !isOwner(existingListing)) {
        setError("You do not have permission to edit this donation.");
        return;
      }
    }

    setSaving(true);
    setError("");
    setMessage("");

    const isEditing = editingId !== null;

    const url = isEditing
      ? `/api/listings/${editingId}`
      : "/api/listings";

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY);
          setAuthUser(null);
          closeForm();
          openAuth("login");
          throw new Error("Your session expired. Please log in again.");
        }

        throw new Error(await readError(response));
      }

      closeForm();
      await loadListings();

      setMessage(
        isEditing
          ? "Donation updated successfully!"
          : "Donation created successfully!"
      );

      scrollToSection("donations");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save donation"
      );
    } finally {
      setSaving(false);
    }
  }

  // Read a single donation.
  async function viewDetails(id: number) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/listings/${id}`);

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data: Listing = await response.json();

      setSelectedListing(data);
      setShowForm(false);
      setEditingId(null);

      scrollToSection("donation-details");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load donation details"
      );
    }
  }

  // Open the delete confirmation modal.
  function confirmDelete(listing: Listing) {
    if (!isOwner(listing)) {
      setError("You can only delete donations created by your account.");
      return;
    }

    setDeleteTarget(listing);
    setError("");
  }

  function cancelDelete() {
    if (deletingId !== null) return;
    setDeleteTarget(null);
  }

  // Delete an owned donation.
  async function deleteListing() {
    if (!deleteTarget || deletingId !== null) return;

    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!authUser || !token) {
      setDeleteTarget(null);
      openAuth("login");
      return;
    }

    if (!isOwner(deleteTarget)) {
      setDeleteTarget(null);
      setError("You do not have permission to delete this donation.");
      return;
    }

    const id = deleteTarget.id;

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY);
          setAuthUser(null);
          setDeleteTarget(null);
          openAuth("login");
          throw new Error("Your session expired. Please log in again.");
        }

        throw new Error(await readError(response));
      }

      setDeleteTarget(null);
      setSelectedListing(null);

      if (editingId === id) {
        closeForm();
      }

      await loadListings();

      setMessage("Donation deleted successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete donation"
      );
    } finally {
      setDeletingId(null);
    }
  }

  // Search and filter donations.
  const filteredListings = listings.filter((listing) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      listing.title.toLowerCase().includes(keyword) ||
      listing.pickup_address.toLowerCase().includes(keyword);

    const matchesCategory =
      categoryFilter === "all" ||
      listing.category.toLowerCase() === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalItems = listings.reduce(
    (total, listing) => total + listing.quantity,
    0
  );

  return (
    <div className="app">
      {/* Navigation */}
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
              <span className="auth-loading">Checking account...</span>
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

      <main className="main-content">
        {/* Hero Section */}
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="hero-label">
              A Community Donation Platform
            </span>

            <h1>
              Share warmth.
              <br />
              <span>Spread kindness.</span>
            </h1>

            <p>
              Give your unused winter clothes a new purpose.
              Every jacket, sweater, and blanket can make
              a difference.
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={openCreateForm}
              disabled={checkingSession}
            >
              + Donate Clothes
            </button>
          </div>

          <div className="hero-art">
            <div className="hero-circle">
              <span className="hero-emoji">🧥</span>
              <span className="hero-heart">♥</span>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="stats">
          <div className="stat-card">
            <span className="stat-icon">📦</span>
            <div>
              <h2>{listings.length}</h2>
              <p>Donation Listings</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">📘</span>
            <div>
              <h2>{totalItems}</h2>
              <p>Total Items</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">💚</span>
            <div>
              <h2>{categories.length}</h2>
              <p>Donation Categories</p>
            </div>
          </div>
        </section>

        {/* Messages */}
        {message && (
          <div className="alert alert-success" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {/* Donation Form */}
        {showForm && authUser && (
          <section
            className="form-section"
            id="donation-form"
            style={{ scrollMarginTop: 110 }}
          >
            <div className="section-heading">
              <div>
                <span className="section-label">
                  {editingId !== null
                    ? "UPDATE DONATION"
                    : "SHARE YOUR WARMTH"}
                </span>

                <h2>
                  {editingId !== null
                    ? "Edit Donation"
                    : "Add a New Donation"}
                </h2>

                <p>
                  Fill in the details of the clothes
                  you would like to donate.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                onClick={closeForm}
              >
                Close
              </button>
            </div>

            <form className="donation-form" onSubmit={handleSubmit}>
              <div className="form-group full-width">
                <label htmlFor="title">Donation Title</label>
                <input
                  id="title"
                  type="text"
                  required
                  minLength={3}
                  maxLength={150}
                  placeholder="Example: Warm Winter Jacket"
                  value={form.title}
                  onChange={(event) =>
                    updateForm("title", event.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(event) =>
                    updateForm("category", event.target.value)
                  }
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {formatText(category)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="size">Size</label>
                <select
                  id="size"
                  value={form.size}
                  onChange={(event) =>
                    updateForm("size", event.target.value)
                  }
                >
                  <option value="free">Free Size</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="age_group">Age Group</label>
                <select
                  id="age_group"
                  value={form.age_group}
                  onChange={(event) =>
                    updateForm("age_group", event.target.value)
                  }
                >
                  <option value="child">Child</option>
                  <option value="adult">Adult</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={form.gender}
                  onChange={(event) =>
                    updateForm("gender", event.target.value)
                  }
                >
                  <option value="unisex">Unisex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="condition">Condition</label>
                <select
                  id="condition"
                  value={form.condition}
                  onChange={(event) =>
                    updateForm("condition", event.target.value)
                  }
                >
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="worn">Worn</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={form.quantity}
                  onChange={(event) =>
                    updateForm("quantity", Number(event.target.value))
                  }
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="pickup_address">
                  Pickup Address
                </label>
                <textarea
                  id="pickup_address"
                  required
                  minLength={5}
                  maxLength={255}
                  placeholder="Example: Uttara, Dhaka"
                  value={form.pickup_address}
                  onChange={(event) =>
                    updateForm("pickup_address", event.target.value)
                  }
                />
                <small>
                  This address is currently public.
                  For testing, use a general or fictional location,
                  not a private home address.
                </small>
              </div>

              <div className="form-actions full-width">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Update Donation"
                    : "Create Donation"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Single Donation Details */}
        {selectedListing && (
          <section
            className="details-section"
            id="donation-details"
            style={{ scrollMarginTop: 110 }}
          >
            <div className="section-heading">
              <div>
                <span className="section-label">
                  DONATION DETAILS
                </span>
                <h2>{selectedListing.title}</h2>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedListing(null)}
              >
                Close
              </button>
            </div>

            <div className="details-grid">
              <p>
                <strong>ID:</strong> {selectedListing.id}
              </p>

              <p>
                <strong>Category:</strong>{" "}
                {formatText(selectedListing.category)}
              </p>

              <p>
                <strong>Size:</strong>{" "}
                {formatText(selectedListing.size)}
              </p>

              <p>
                <strong>Age Group:</strong>{" "}
                {formatText(selectedListing.age_group)}
              </p>

              <p>
                <strong>Gender:</strong>{" "}
                {formatText(selectedListing.gender)}
              </p>

              <p>
                <strong>Condition:</strong>{" "}
                {formatText(selectedListing.condition)}
              </p>

              <p>
                <strong>Quantity:</strong>{" "}
                {selectedListing.quantity}
              </p>

              <p>
                <strong>Pickup Address:</strong>{" "}
                {selectedListing.pickup_address}
              </p>

              <p>
                <strong>Ownership:</strong>{" "}
                {selectedListing.owner_id === null
                  ? "Legacy donation"
                  : isOwner(selectedListing)
                  ? "Your donation"
                  : "Community donation"}
              </p>
            </div>

            {isOwner(selectedListing) && (
              <div className="card-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => openEditForm(selectedListing)}
                >
                  Edit Donation
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={deletingId === selectedListing.id}
                  onClick={() => confirmDelete(selectedListing)}
                >
                  Delete Donation
                </button>
              </div>
            )}
          </section>
        )}

        {/* Donation List */}
        <section
          className="donations-section"
          id="donations"
          style={{ scrollMarginTop: 110 }}
        >
          <div className="section-heading">
            <div>
              <span className="section-label">
                BROWSE DONATIONS
              </span>

              <h2>Available Donations</h2>

              <p>
                Discover clothes and winter essentials
                shared by the community.
              </p>
            </div>
          </div>

          {/* Search and Category Filter */}
          <div className="filter-bar">
            <input
              type="search"
              placeholder="Search by title or pickup location..."
              aria-label="Search donations"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
            >
              <option value="all">All Categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatText(category)}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => void loadListings()}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/* Loading and Empty States */}
          {loading && listings.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">⏳</span>
              <h3>Loading donations...</h3>
              <p>
                Please wait while we retrieve the listings.
              </p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <h3>No donations found</h3>
              <p>
                Try another search or add a new donation.
              </p>
            </div>
          ) : (
            <div className="donation-grid">
              {filteredListings.map((listing) => (
                <article
                  className="donation-card"
                  key={listing.id}
                >
                  <div className="card-image">
                    <span className="category-badge">
                      {formatText(listing.category)}
                    </span>

                    <span className="card-emoji">
                      {categoryEmojis[
                        listing.category.toLowerCase()
                      ] || "📦"}
                    </span>
                  </div>

                  <div className="card-body">
                    <h3>{listing.title}</h3>

                    <p className="card-meta">
                      {formatText(listing.condition)} ·{" "}
                      {formatText(listing.age_group)} ·{" "}
                      {formatText(listing.size)}
                    </p>

                    <p className="card-location">
                      📍 {listing.pickup_address}
                    </p>

                    <span className="quantity-label">
                      Quantity: {listing.quantity}
                    </span>

                    {isOwner(listing) && (
                      <p className="card-meta">
                        Your donation
                      </p>
                    )}

                    <div className="card-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                          void viewDetails(listing.id)
                        }
                      >
                        View Details
                      </button>

                      {isOwner(listing) && (
                        <>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => openEditForm(listing)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger"
                            disabled={deletingId === listing.id}
                            onClick={() => confirmDelete(listing)}
                          >
                            {deletingId === listing.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Registration and Login Modal */}
      {authMode && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !authBusy
            ) {
              setAuthMode(null);
            }
          }}
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
                onClick={() => setAuthMode(null)}
              >
                ×
              </button>
            </div>

            {authError && (
              <div className="alert alert-error" role="alert">
                {authError}
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleAuth}
            >
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
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
          >
            <div className="delete-modal-icon">
              🗑️
            </div>

            <h2 id="delete-modal-title">
              Delete Donation?
            </h2>

            <p id="delete-modal-description">
              Are you sure you want to delete
              <strong> {deleteTarget.title}</strong>?
              <br />
              This action cannot be undone.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                disabled={deletingId !== null}
                onClick={cancelDelete}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-confirm-delete"
                disabled={deletingId !== null}
                onClick={() => void deleteListing()}
              >
                {deletingId !== null
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>
          WarmShare — Share warmth, spread kindness.
        </p>
        <p>
          Made for communities in Bangladesh.
        </p>
      </footer>
    </div>
  );
}

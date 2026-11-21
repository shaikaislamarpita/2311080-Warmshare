
import { useEffect, useState, type FormEvent } from "react";

import type { Listing, ListingForm } from "../types/listing";
import type { AuthUser, AuthMode } from "../types/auth";

import {
  TOKEN_KEY,
  emptyForm,
  categories,
} from "../constants/listing";

import { formatText } from "../utils/formatText";
import { readError } from "../utils/readError";

import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from "../services/authService";

import {
  refreshAccessToken,
  clearStoredToken,
} from "../services/api";

import {
  getListings,
  getListingById,
  saveListing,
  deleteListingById,
} from "../services/listingService";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

import AuthModal from "../components/auth/AuthModal";

import DonationForm from "../components/listings/DonationForm";
import DonationCard from "../components/listings/DonationCard";
import DonationDetails from "../components/listings/DonationDetails";
import DeleteConfirmation from "../components/listings/DeleteConfirmation";

export default function HomePage() {
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

  // Restore login using the refresh cookie when the browser reloads.
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await refreshAccessToken();

        if (!token) {
          setAuthUser(null);
          return;
        }

        const response = await getCurrentUser(token);

        if (!response.ok) {
          throw new Error("Invalid session");
        }

        const user: AuthUser = await response.json();
        setAuthUser(user);
      } catch {
        clearStoredToken();
        setAuthUser(null);
      } finally {
        setCheckingSession(false);
      }
    }

    restoreSession();
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

  async function logout() {
    let logoutConfirmed = false;

    try {
      const response = await logoutUser();

      if (!response.ok) {
        throw new Error("Server logout could not be confirmed.");
      }

      logoutConfirmed = true;
    } catch {
      logoutConfirmed = false;
    } finally {
      clearStoredToken();

      setAuthUser(null);
      setAuthMode(null);
      setShowForm(false);
      setEditingId(null);
      setDeleteTarget(null);

      setError("");

      if (logoutConfirmed) {
        setMessage("You have logged out successfully.");
      } else {
        setMessage("");
        setError(
          "You have been logged out on this device, but server logout could not be confirmed. Please check your connection."
        );
      }
    }
  }

  // Handle registration and login.
  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authMode) return;

    setAuthBusy(true);
    setAuthError("");

    try {
      if (authMode === "register") {
        const registerResponse = await registerUser(
          authName,
          authEmail,
          authPassword
        );

        if (!registerResponse.ok) {
          throw new Error(await readError(registerResponse));
        }
      }

      const loginResponse = await loginUser(authEmail, authPassword);

      if (!loginResponse.ok) {
        throw new Error(await readError(loginResponse));
      }

      const loginData: {
        access_token: string;
        token_type: string;
      } = await loginResponse.json();

      const profileResponse = await getCurrentUser(loginData.access_token);

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
    setError("");

    try {
      const response = await getListings();

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

    try {
      const response = await saveListing(form, token, editingId);

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
      const response = await getListingById(id);

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
      const response = await deleteListingById(id, token);

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
      <Navbar
        checkingSession={checkingSession}
        authUser={authUser}
        logout={logout}
        openAuth={openAuth}
        openCreateForm={openCreateForm}
      />

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
              <span className="hero-emoji">ðŸ§¥</span>
              <span className="hero-heart">â™¥</span>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="stats">
          <div className="stat-card">
            <span className="stat-icon">ðŸ“¦</span>
            <div>
              <h2>{listings.length}</h2>
              <p>Donation Listings</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">ðŸ“˜</span>
            <div>
              <h2>{totalItems}</h2>
              <p>Total Items</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">ðŸ’š</span>
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

        {/* Donation Form Component */}
        <DonationForm
          showForm={showForm && authUser !== null}
          editingId={editingId}
          form={form}
          saving={saving}
          closeForm={closeForm}
          updateForm={updateForm}
          handleSubmit={handleSubmit}
        />

        {/* Donation Details Component */}
        <DonationDetails
          selectedListing={selectedListing}
          isOwner={isOwner}
          deletingId={deletingId}
          closeDetails={() => setSelectedListing(null)}
          openEditForm={openEditForm}
          confirmDelete={confirmDelete}
        />

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
              <span className="empty-icon">â³</span>
              <h3>Loading donations...</h3>
              <p>
                Please wait while we retrieve the listings.
              </p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">ðŸ“¦</span>
              <h3>No donations found</h3>
              <p>
                Try another search or add a new donation.
              </p>
            </div>
          ) : (
            <div className="donation-grid">
              {filteredListings.map((listing) => (
                <DonationCard
                  key={listing.id}
                  listing={listing}
                  isOwner={isOwner(listing)}
                  deleting={deletingId === listing.id}
                  viewDetails={viewDetails}
                  openEditForm={openEditForm}
                  confirmDelete={confirmDelete}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Authentication Modal Component */}
      <AuthModal
        authMode={authMode}
        authName={authName}
        authEmail={authEmail}
        authPassword={authPassword}
        authBusy={authBusy}
        authError={authError}
        setAuthName={setAuthName}
        setAuthEmail={setAuthEmail}
        setAuthPassword={setAuthPassword}
        closeAuth={() => setAuthMode(null)}
        openAuth={openAuth}
        handleAuth={handleAuth}
      />

      {/* Delete Confirmation Component */}
      <DeleteConfirmation
        deleteTarget={deleteTarget}
        deletingId={deletingId}
        cancelDelete={cancelDelete}
        deleteListing={deleteListing}
      />

      <Footer />
    </div>
  );
}

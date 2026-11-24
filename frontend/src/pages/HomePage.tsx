
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

import AdminDashboard from "../components/dashboard/AdminDashboard";
import ModeratorDashboard from "../components/dashboard/ModeratorDashboard";
import UserDashboard from "../components/dashboard/UserDashboard";

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] =
    useState<Listing | null>(null);

  const [form, setForm] = useState<ListingForm>({
    ...emptyForm,
    group_id: null,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<Listing | null>(null);

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

  // Dashboard navigation
  const [showDashboard, setShowDashboard] = useState(false);

  // Restore login using the refresh cookie.
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

    void restoreSession();
  }, []);

  // Load donations when the page opens.
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

  // ========================================
  // DASHBOARD NAVIGATION
  // ========================================

  function openDashboard() {
    if (!authUser || checkingSession) return;

    setShowDashboard(true);
    setShowForm(false);
    setSelectedListing(null);
    setEditingId(null);
    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeDashboard() {
    setShowDashboard(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ========================================
  // AUTHENTICATION
  // ========================================

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
        throw new Error(
          "Server logout could not be confirmed."
        );
      }

      logoutConfirmed = true;
    } catch {
      logoutConfirmed = false;
    } finally {
      clearStoredToken();

      setAuthUser(null);
      setAuthMode(null);
      setShowDashboard(false);
      setShowForm(false);
      setEditingId(null);
      setDeleteTarget(null);
      setSelectedListing(null);

      setForm({
        ...emptyForm,
        group_id: null,
      });

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

  async function handleAuth(
    event: FormEvent<HTMLFormElement>
  ) {
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
          throw new Error(
            await readError(registerResponse)
          );
        }
      }

      const loginResponse = await loginUser(
        authEmail,
        authPassword
      );

      if (!loginResponse.ok) {
        throw new Error(
          await readError(loginResponse)
        );
      }

      const loginData: {
        access_token: string;
        token_type: string;
      } = await loginResponse.json();

      const profileResponse = await getCurrentUser(
        loginData.access_token
      );

      if (!profileResponse.ok) {
        throw new Error(
          await readError(profileResponse)
        );
      }

      const user: AuthUser =
        await profileResponse.json();

      sessionStorage.setItem(
        TOKEN_KEY,
        loginData.access_token
      );

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
        err instanceof Error
          ? err.message
          : "Authentication failed"
      );
    } finally {
      setAuthBusy(false);
    }
  }

  // ========================================
  // LOAD DONATIONS
  // ========================================

  async function loadListings() {
    setLoading(true);
    setError("");

    try {
      const response = await getListings();

      if (!response.ok) {
        throw new Error(
          await readError(response)
        );
      }

      const data: Listing[] =
        await response.json();

      setListings(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load donations"
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // CREATE DONATION
  // ========================================

  function openCreateForm() {
    if (checkingSession) return;

    if (!authUser) {
      setError("");
      openAuth("login");
      return;
    }

    setShowDashboard(false);

    // New donations start as personal donations.
    setForm({
      ...emptyForm,
      group_id: null,
    });

    setEditingId(null);
    setSelectedListing(null);
    setShowForm(true);
    setError("");
    setMessage("");

    scrollToSection("donation-form");
  }

  // ========================================
  // EDIT DONATION
  // ========================================

  function openEditForm(listing: Listing) {
    if (!isOwner(listing)) {
      setError(
        "You can only edit donations created by your account."
      );
      return;
    }

    setShowDashboard(false);

    // Keep the existing group assignment.
    // Null means this is a personal donation.
    setForm({
      title: listing.title,
      category: listing.category,
      size: listing.size,
      age_group: listing.age_group,
      gender: listing.gender,
      condition: listing.condition,
      quantity: listing.quantity,
      pickup_address: listing.pickup_address,
      group_id: listing.group_id ?? null,
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

    setForm({
      ...emptyForm,
      group_id: null,
    });
  }

  // ========================================
  // UPDATE FORM FIELDS
  // ========================================

  function updateForm(
    field: keyof ListingForm,
    value: string | number | null
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ========================================
  // CREATE OR UPDATE DONATION
  // ========================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token =
      sessionStorage.getItem(TOKEN_KEY);

    if (!authUser || !token) {
      closeForm();
      openAuth("login");
      return;
    }

    if (editingId !== null) {
      const existingListing = listings.find(
        (listing) => listing.id === editingId
      );

      if (
        !existingListing ||
        !isOwner(existingListing)
      ) {
        setError(
          "You do not have permission to edit this donation."
        );
        return;
      }
    }

    setSaving(true);
    setError("");
    setMessage("");

    const isEditing = editingId !== null;

    try {
      // Include group_id in the request.
      // null = personal donation.
      // number = selected group donation.
      const donationData: ListingForm = {
        ...form,
        group_id: form.group_id ?? null,
      };

      const response = await saveListing(
        donationData,
        token,
        editingId
      );

      if (!response.ok) {
        if (response.status === 401) {
          clearStoredToken();
          setAuthUser(null);
          closeForm();
          openAuth("login");

          throw new Error(
            "Your session expired. Please log in again."
          );
        }

        throw new Error(
          await readError(response)
        );
      }

      closeForm();
      await loadListings();

      setMessage(
        isEditing
          ? "Donation updated successfully!"
          : "Donation created successfully!"
      );

      setShowDashboard(false);
      scrollToSection("donations");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save donation"
      );
    } finally {
      setSaving(false);
    }
  }

  // ========================================
  // VIEW DONATION DETAILS
  // ========================================

  async function viewDetails(id: number) {
    setError("");
    setMessage("");

    try {
      const response = await getListingById(id);

      if (!response.ok) {
        throw new Error(
          await readError(response)
        );
      }

      const data: Listing =
        await response.json();

      setSelectedListing(data);
      setShowForm(false);
      setShowDashboard(false);
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

  // ========================================
  // DELETE DONATION
  // ========================================

  function confirmDelete(listing: Listing) {
    if (!isOwner(listing)) {
      setError(
        "You can only delete donations created by your account."
      );
      return;
    }

    setDeleteTarget(listing);
    setError("");
  }

  function cancelDelete() {
    if (deletingId !== null) return;

    setDeleteTarget(null);
  }

  async function deleteListing() {
    if (!deleteTarget || deletingId !== null) {
      return;
    }

    const token =
      sessionStorage.getItem(TOKEN_KEY);

    if (!authUser || !token) {
      setDeleteTarget(null);
      openAuth("login");
      return;
    }

    if (!isOwner(deleteTarget)) {
      setDeleteTarget(null);
      setError(
        "You do not have permission to delete this donation."
      );
      return;
    }

    const id = deleteTarget.id;

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const response = await deleteListingById(
        id,
        token
      );

      if (!response.ok) {
        if (response.status === 401) {
          clearStoredToken();
          setAuthUser(null);
          setDeleteTarget(null);
          openAuth("login");

          throw new Error(
            "Your session expired. Please log in again."
          );
        }

        throw new Error(
          await readError(response)
        );
      }

      setDeleteTarget(null);
      setSelectedListing(null);

      if (editingId === id) {
        closeForm();
      }

      await loadListings();

      setMessage(
        "Donation deleted successfully!"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete donation"
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ========================================
  // SEARCH AND FILTER DONATIONS
  // ========================================

  const filteredListings = listings.filter(
    (listing) => {
      const keyword =
        search.trim().toLowerCase();

      const matchesSearch =
        listing.title
          .toLowerCase()
          .includes(keyword) ||
        listing.pickup_address
          .toLowerCase()
          .includes(keyword);

      const matchesCategory =
        categoryFilter === "all" ||
        listing.category.toLowerCase() ===
          categoryFilter;

      return (
        matchesSearch &&
        matchesCategory
      );
    }
  );

  const totalItems = listings.reduce(
    (total, listing) =>
      total + listing.quantity,
    0
  );

  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="app">
      <Navbar
        checkingSession={checkingSession}
        authUser={authUser}
        logout={logout}
        openAuth={openAuth}
        openCreateForm={openCreateForm}
        openDashboard={openDashboard}
      />

      <main className="main-content">
        {showDashboard && authUser ? (
          <>
            {authUser.role === "admin" ? (
              <AdminDashboard
                currentUserId={authUser.id}
                onBack={closeDashboard}
              />
            ) : authUser.role === "moderator" ? (
              <ModeratorDashboard
                onBack={closeDashboard}
              />
            ) : (
              <UserDashboard
                currentUser={authUser}
                onBack={closeDashboard}
                onUserUpdated={setAuthUser}
              />
            )}
          </>
        ) : (
          <>
            {/* HERO SECTION */}

            <section
              className="hero"
              id="home"
            >
              <div className="hero-content">
                <span className="hero-label">
                  A Community Donation Platform
                </span>

                <h1>
                  Share warmth.
                  <br />
                  <span>
                    Spread kindness.
                  </span>
                </h1>

                <p>
                  Give your unused winter clothes
                  a new purpose. Every jacket,
                  sweater, and blanket can make
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
                  <span className="hero-emoji">
                    {"\u{1F9E5}"}
                  </span>

                  <span className="hero-heart">
                    {"\u2665"}
                  </span>
                </div>
              </div>
            </section>

            {/* STATISTICS */}

            <section className="stats">
              <div className="stat-card">
                <span className="stat-icon">
                  {"\u{1F4E6}"}
                </span>

                <div>
                  <h2>
                    {listings.length}
                  </h2>
                  <p>
                    Donation Listings
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">
                  {"\u{1F4D8}"}
                </span>

                <div>
                  <h2>{totalItems}</h2>
                  <p>Total Items</p>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">
                  {"\u{1F49A}"}
                </span>

                <div>
                  <h2>
                    {categories.length}
                  </h2>
                  <p>
                    Donation Categories
                  </p>
                </div>
              </div>
            </section>

            {/* MESSAGES */}

            {message && (
              <div
                className="alert alert-success"
                role="status"
              >
                {message}
              </div>
            )}

            {error && (
              <div
                className="alert alert-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* DONATION FORM */}

            <DonationForm
              showForm={
                showForm &&
                authUser !== null
              }
              editingId={editingId}
              form={form}
              saving={saving}
              closeForm={closeForm}
              updateForm={updateForm}
              handleSubmit={handleSubmit}
            />

            {/* DONATION DETAILS */}

            <DonationDetails
              selectedListing={selectedListing}
              isOwner={isOwner}
              deletingId={deletingId}
              closeDetails={() =>
                setSelectedListing(null)
              }
              openEditForm={openEditForm}
              confirmDelete={confirmDelete}
            />

            {/* DONATION LIST */}

            <section
              className="donations-section"
              id="donations"
              style={{
                scrollMarginTop: 110,
              }}
            >
              <div className="section-heading">
                <div>
                  <span className="section-label">
                    BROWSE DONATIONS
                  </span>

                  <h2>
                    Available Donations
                  </h2>

                  <p>
                    Discover clothes and winter
                    essentials shared by the
                    community.
                  </p>
                </div>
              </div>

              {/* SEARCH AND CATEGORY FILTER */}

              <div className="filter-bar">
                <input
                  type="search"
                  placeholder="Search by title or pickup location..."
                  aria-label="Search donations"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />

                <select
                  aria-label="Filter by category"
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All Categories
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {formatText(
                          category
                        )}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() =>
                    void loadListings()
                  }
                  disabled={loading}
                >
                  {loading
                    ? "Loading..."
                    : "Refresh"}
                </button>
              </div>

              {/* LOADING AND EMPTY STATES */}

              {loading &&
              listings.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    {"\u23F3"}
                  </span>

                  <h3>
                    Loading donations...
                  </h3>

                  <p>
                    Please wait while we
                    retrieve the listings.
                  </p>
                </div>
              ) : filteredListings.length ===
                0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    {"\u{1F4E6}"}
                  </span>

                  <h3>
                    No donations found
                  </h3>

                  <p>
                    Try another search or
                    add a new donation.
                  </p>
                </div>
              ) : (
                <div className="donation-grid">
                  {filteredListings.map(
                    (listing) => (
                      <DonationCard
                        key={listing.id}
                        listing={listing}
                        isOwner={isOwner(
                          listing
                        )}
                        deleting={
                          deletingId ===
                          listing.id
                        }
                        viewDetails={
                          viewDetails
                        }
                        openEditForm={
                          openEditForm
                        }
                        confirmDelete={
                          confirmDelete
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* AUTHENTICATION MODAL */}

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
        closeAuth={() =>
          setAuthMode(null)
        }
        openAuth={openAuth}
        handleAuth={handleAuth}
      />

      {/* DELETE CONFIRMATION */}

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

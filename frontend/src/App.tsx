
import { useEffect, useState, type FormEvent } from "react"

// Data received from FastAPI
type Listing = {
  id: number
  title: string
  category: string
  size: string
  age_group: string
  gender: string
  condition: string
  quantity: number
  pickup_address: string
}

// Data sent to FastAPI
type ListingForm = Omit<Listing, "id">

const emptyForm: ListingForm = {
  title: "",
  category: "jacket",
  size: "M",
  age_group: "adult",
  gender: "unisex",
  condition: "good",
  quantity: 1,
  pickup_address: "",
}

const categories = [
  "jacket",
  "sweater",
  "blanket",
  "shawl",
  "socks",
]

const categoryEmojis: Record<string, string> = {
  jacket: "🧥",
  sweater: "🧶",
  blanket: "🛏️",
  shawl: "🧣",
  socks: "🧦",
}

function formatText(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

// Read error messages returned by FastAPI
async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json()

    if (typeof data.detail === "string") {
      return data.detail
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item: { msg?: string }) => item.msg || "Invalid input")
        .join(", ")
    }
  } catch {
    // Use a general message if response is not JSON
  }

  return `Request failed (${response.status})`
}

export default function App() {
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListing, setSelectedListing] =
    useState<Listing | null>(null)

  const [form, setForm] = useState<ListingForm>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Donation selected for deletion
  const [deleteTarget, setDeleteTarget] =
    useState<Listing | null>(null)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // Scroll to an element after React updates the page
  function scrollToSection(id: string) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      })
    })
  }

  // READ LIST: GET /api/listings
  async function loadListings() {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/listings")

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      const data: Listing[] = await response.json()
      setListings(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load donations"
      )
    } finally {
      setLoading(false)
    }
  }

  // Load donations when the application opens
  useEffect(() => {
    void loadListings()
  }, [])

  // Open the Create Donation form
  function openCreateForm() {
    setForm({ ...emptyForm })
    setEditingId(null)
    setSelectedListing(null)
    setShowForm(true)
    setError("")
    setMessage("")
    scrollToSection("donation-form")
  }

  // Open the Edit Donation form
  function openEditForm(listing: Listing) {
    setForm({
      title: listing.title,
      category: listing.category,
      size: listing.size,
      age_group: listing.age_group,
      gender: listing.gender,
      condition: listing.condition,
      quantity: listing.quantity,
      pickup_address: listing.pickup_address,
    })

    setEditingId(listing.id)
    setSelectedListing(null)
    setShowForm(true)
    setError("")
    setMessage("")
    scrollToSection("donation-form")
  }

  // Close the donation form
  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyForm })
  }

  // Update a field in the form
  function updateForm(
    field: keyof ListingForm,
    value: string | number
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  // CREATE: POST /api/listings
  // UPDATE: PUT /api/listings/{id}
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setError("")
    setMessage("")

    const isEditing = editingId !== null

    const url = isEditing
      ? `/api/listings/${editingId}`
      : "/api/listings"

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      closeForm()

      setMessage(
        isEditing
          ? "Donation updated successfully!"
          : "Donation created successfully!"
      )

      await loadListings()
      scrollToSection("donations")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save donation"
      )
    } finally {
      setSaving(false)
    }
  }

  // READ SINGLE: GET /api/listings/{id}
  async function viewDetails(id: number) {
    setError("")
    setMessage("")

    try {
      const response = await fetch(`/api/listings/${id}`)

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      const data: Listing = await response.json()

      setSelectedListing(data)
      setShowForm(false)
      setEditingId(null)

      // Automatically scroll to the selected donation
      scrollToSection("donation-details")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load donation details"
      )
    }
  }

  // Open the custom Delete Confirmation Modal
  function confirmDelete(listing: Listing) {
    setDeleteTarget(listing)
  }

  // Close the custom Delete Confirmation Modal
  function cancelDelete() {
    if (deletingId !== null) return
    setDeleteTarget(null)
  }

  // DELETE: DELETE /api/listings/{id}
  async function deleteListing() {
    if (!deleteTarget || deletingId !== null) return

    const id = deleteTarget.id

    setDeletingId(id)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(await readError(response))
      }

      setDeleteTarget(null)
      setSelectedListing(null)

      if (editingId === id) {
        closeForm()
      }

      setMessage("Donation deleted successfully!")

      await loadListings()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete donation"
      )
    } finally {
      setDeletingId(null)
    }
  }

  // Search and filter donations
  const filteredListings = listings.filter((listing) => {
    const keyword = search.trim().toLowerCase()

    const matchesSearch =
      listing.title.toLowerCase().includes(keyword) ||
      listing.pickup_address.toLowerCase().includes(keyword)

    const matchesCategory =
      categoryFilter === "all" ||
      listing.category.toLowerCase() === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Calculate total donated items
  const totalItems = listings.reduce(
    (total, listing) => total + listing.quantity,
    0
  )

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

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateForm}
          >
            + Add Donation
          </button>
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

        {/* Success and Error Messages */}
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
        {showForm && (
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
                <label htmlFor="title">
                  Donation Title
                </label>

                <input
                  id="title"
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  placeholder="Example: Warm Winter Jacket"
                  value={form.title}
                  onChange={(event) =>
                    updateForm("title", event.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">
                  Category
                </label>

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
                <label htmlFor="age_group">
                  Age Group
                </label>

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
                <label htmlFor="condition">
                  Condition
                </label>

                <select
                  id="condition"
                  value={form.condition}
                  onChange={(event) =>
                    updateForm("condition", event.target.value)
                  }
                >
                  <option value="like new">Like New</option>
                  <option value="good">Good</option>
                  <option value="worn">Worn</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quantity">
                  Quantity
                </label>

                <input
                  id="quantity"
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={form.quantity}
                  onChange={(event) =>
                    updateForm(
                      "quantity",
                      Number(event.target.value)
                    )
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
                  minLength={3}
                  placeholder="Example: Uttara, Dhaka"
                  value={form.pickup_address}
                  onChange={(event) =>
                    updateForm(
                      "pickup_address",
                      event.target.value
                    )
                  }
                />
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
            </div>

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
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
            >
              <option value="all">
                All Categories
              </option>

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

          {/* Loading State */}
          {loading && listings.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">⏳</span>
              <h3>Loading donations...</h3>
              <p>
                Please wait while we retrieve the listings.
              </p>
            </div>
          ) : filteredListings.length === 0 ? (
            /* Empty State */
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <h3>No donations found</h3>
              <p>
                Try another search or add a new donation.
              </p>
            </div>
          ) : (
            /* Donation Cards */
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
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Custom Delete Confirmation Modal */}
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
  )
}


import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import type { ListingForm } from "../../types/listing";
import type { Group } from "../../types/group";

import { categories } from "../../constants/listing";
import { formatText } from "../../utils/formatText";

import { getMyGroups } from "../../services/groupService";

type DonationFormProps = {
  showForm: boolean;
  editingId: number | null;
  form: ListingForm;
  saving: boolean;
  updateForm: (
    field: keyof ListingForm,
    value: string | number | null
  ) => void;
  closeForm: () => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function DonationForm({
  showForm,
  editingId,
  form,
  saving,
  updateForm,
  closeForm,
  handleSubmit,
}: DonationFormProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupError, setGroupError] = useState("");

  // ========================================
  // LOAD AVAILABLE GROUPS
  // ========================================

  useEffect(() => {
    if (!showForm) {
      return;
    }

    let cancelled = false;

    async function loadGroups() {
      setLoadingGroups(true);
      setGroupError("");

      try {
        const data = await getMyGroups();

        if (!cancelled) {
          setGroups(data);
        }
      } catch (error) {
        if (!cancelled) {
          setGroups([]);

          setGroupError(
            error instanceof Error
              ? error.message
              : "Unable to load your groups."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingGroups(false);
        }
      }
    }

    void loadGroups();

    return () => {
      cancelled = true;
    };
  }, [showForm]);

  if (!showForm) {
    return null;
  }

  const selectedGroupId = form.group_id ?? null;

  // ========================================
  // HANDLE GROUP SELECTION
  // ========================================

  function handleGroupChange(value: string) {
    if (value === "") {
      updateForm("group_id", null);
      return;
    }

    const groupId = Number(value);

    if (Number.isSafeInteger(groupId) && groupId > 0) {
      updateForm("group_id", groupId);
    }
  }

  return (
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
          disabled={saving}
        >
          Close
        </button>
      </div>

      <form
        className="donation-form"
        onSubmit={handleSubmit}
      >
        {/* ========================================
            DONATION GROUP SELECTION
        ======================================== */}

        <div className="form-group full-width">
          <label htmlFor="donation-group">
            Donation Type
          </label>

          <select
            id="donation-group"
            value={selectedGroupId ?? ""}
            onChange={(event) =>
              handleGroupChange(event.target.value)
            }
            disabled={saving || loadingGroups}
          >
            <option value="">
              Personal Donation
            </option>

            {groups.map((group) => (
              <option
                key={group.id}
                value={group.id}
              >
                Group Donation: {group.name}
              </option>
            ))}
          </select>

          <p
            style={{
              fontSize: "0.9rem",
              marginTop: "0.5rem",
            }}
          >
            {selectedGroupId === null
              ? "This donation belongs to your personal account."
              : "This donation will be shared with the selected group."}
          </p>

          {loadingGroups && (
            <p>Loading your groups...</p>
          )}

          {groupError && (
            <div
              className="alert alert-error"
              role="alert"
            >
              {groupError}
              {" "}
              You can still create a personal donation.
            </div>
          )}

          {groups.length === 0 &&
            !loadingGroups &&
            !groupError && (
              <p
                style={{
                  fontSize: "0.9rem",
                }}
              >
                You are not currently a member
                of any group. Create a group
                from My Dashboard to share donations.
              </p>
            )}

          {editingId !== null && (
            <p
              style={{
                fontSize: "0.9rem",
              }}
            >
              Changing a personal donation to a group
              donation requires permission to assign
              your own donations to that group.
            </p>
          )}
        </div>

        {/* ========================================
            DONATION TITLE
        ======================================== */}

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
            disabled={saving}
          />
        </div>

        {/* ========================================
            CATEGORY
        ======================================== */}

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
            disabled={saving}
          >
            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {formatText(category)}
              </option>
            ))}
          </select>
        </div>

        {/* ========================================
            SIZE
        ======================================== */}

        <div className="form-group">
          <label htmlFor="size">
            Size
          </label>

          <select
            id="size"
            value={form.size}
            onChange={(event) =>
              updateForm("size", event.target.value)
            }
            disabled={saving}
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

        {/* ========================================
            AGE GROUP
        ======================================== */}

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
            disabled={saving}
          >
            <option value="child">Child</option>
            <option value="adult">Adult</option>
          </select>
        </div>

        {/* ========================================
            GENDER
        ======================================== */}

        <div className="form-group">
          <label htmlFor="gender">
            Gender
          </label>

          <select
            id="gender"
            value={form.gender}
            onChange={(event) =>
              updateForm("gender", event.target.value)
            }
            disabled={saving}
          >
            <option value="unisex">Unisex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* ========================================
            CONDITION
        ======================================== */}

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
            disabled={saving}
          >
            <option value="like new">Like New</option>
            <option value="good">Good</option>
            <option value="worn">Worn</option>
          </select>
        </div>

        {/* ========================================
            QUANTITY
        ======================================== */}

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
            disabled={saving}
          />
        </div>

        {/* ========================================
            PICKUP ADDRESS
        ======================================== */}

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
            disabled={saving}
          />
        </div>

        {/* ========================================
            FORM ACTIONS
        ======================================== */}

        <div className="form-actions full-width">
          <button
            type="button"
            className="btn btn-outline"
            onClick={closeForm}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || loadingGroups}
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
  );
}

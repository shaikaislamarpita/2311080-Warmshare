
import type { FormEvent } from "react";
import type { ListingForm } from "../../types/listing";
import { categories } from "../../constants/listing";
import { formatText } from "../../utils/formatText";

type DonationFormProps = {
  showForm: boolean;
  editingId: number | null;
  form: ListingForm;
  saving: boolean;
  updateForm: (
    field: keyof ListingForm,
    value: string | number
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
  if (!showForm) {
    return null;
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
  );
}

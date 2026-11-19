type DeleteConfirmationProps = {
  deleteTarget: { title: string } | null;
  deletingId: number | null;
  cancelDelete: () => void;
  deleteListing: () => void;
};

export default function DeleteConfirmation({
  deleteTarget,
  deletingId,
  cancelDelete,
  deleteListing,
}: DeleteConfirmationProps) {
  if (!deleteTarget) {
    return null;
  }

  return (
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
            onClick={deleteListing}
          >
            {deletingId !== null
              ? "Deleting..."
              : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.orm import Session

# Load local environment variables before connecting to the database.
load_dotenv(".env.development.local")

# Support both local development and Vercel deployment
try:
    from backend.database import get_session_factory
    from backend.models import User
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from database import get_session_factory
    from models import User


ADMIN_EMAIL = "aa@gmail.com"


def provision_admin():
    SessionLocal = get_session_factory()
    db: Session = SessionLocal()

    try:
        # Find the selected account.
        admin_candidate = db.scalar(
            select(User).where(User.email == ADMIN_EMAIL)
        )

        if admin_candidate is None:
            print("ERROR: The selected account was not found.")
            return

        # Check whether an Admin already exists.
        existing_admin = db.scalar(
            select(User).where(User.role == "admin")
        )

        if existing_admin is not None:
            print("ERROR: An Admin account already exists.")
            print("No changes were made.")
            return

        # Display the account before making changes.
        print("\nAdmin account to be promoted:")
        print("User ID:", admin_candidate.id)
        print("Email:", admin_candidate.email)
        print("Current role:", admin_candidate.role)

        if admin_candidate.is_banned:
            print("ERROR: This account is banned.")
            print("No changes were made.")
            return

        confirmation = input(
            "\nType aa@gmail.com to confirm promotion: "
        ).strip().lower()

        if confirmation != ADMIN_EMAIL:
            print("Confirmation did not match.")
            print("No changes were made.")
            return

        # Promote the selected account.
        admin_candidate.role = "admin"
        db.commit()
        db.refresh(admin_candidate)

        print("\nAdmin account successfully provisioned.")
        print("User ID:", admin_candidate.id)
        print("Email:", admin_candidate.email)
        print("Role:", admin_candidate.role)

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    provision_admin()

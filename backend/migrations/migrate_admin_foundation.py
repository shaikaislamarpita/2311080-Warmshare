
from sqlalchemy import text

# Support both local development and Vercel deployment
try:
    from backend.database import get_engine
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from database import get_engine


def migrate_admin_foundation():
    engine = get_engine()

    with engine.begin() as connection:
        # Add the account ban status.
        connection.execute(
            text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS is_banned
                BOOLEAN NOT NULL DEFAULT FALSE
            """)
        )

        # Add the account ban reason.
        connection.execute(
            text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS ban_reason
                VARCHAR(500)
            """)
        )

        # Add the account ban timestamp.
        connection.execute(
            text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS banned_at
                TIMESTAMP WITH TIME ZONE
            """)
        )

        # Add the account update timestamp.
        connection.execute(
            text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS updated_at
                TIMESTAMP WITH TIME ZONE
                NOT NULL DEFAULT CURRENT_TIMESTAMP
            """)
        )

        # Allow only the three supported account roles.
        connection.execute(
            text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'ck_users_valid_role'
                          AND conrelid = 'users'::regclass
                    ) THEN
                        ALTER TABLE users
                        ADD CONSTRAINT ck_users_valid_role
                        CHECK (
                            role IN ('user', 'moderator', 'admin')
                        );
                    END IF;
                END
                $$;
            """)
        )

        # Enforce at most one Admin account.
        connection.execute(
            text("""
                CREATE UNIQUE INDEX IF NOT EXISTS
                uq_users_single_admin
                ON users (role)
                WHERE role = 'admin'
            """)
        )

    print("Admin database foundation migration completed.")


if __name__ == "__main__":
    migrate_admin_foundation()

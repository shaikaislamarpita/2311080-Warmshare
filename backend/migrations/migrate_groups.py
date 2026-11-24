
from sqlalchemy import text

# Support both local development and Vercel deployment.
try:
    from backend.database import get_engine
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from database import get_engine


def migrate_groups():
    """
    Add shared donation groups, group memberships,
    and optional group ownership for listings.

    This migration is designed for PostgreSQL.
    It preserves existing users and listings.
    """
    engine = get_engine()

    if engine.dialect.name != "postgresql":
        raise RuntimeError(
            "The group migration requires PostgreSQL."
        )

    with engine.begin() as connection:

        # 1. Create the shared groups table.
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS groups (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                owner_id INTEGER NOT NULL
                    REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE
                    NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """))

        # 2. Create the group memberships table.
        # Each user may join a group only once.
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS group_members (
                id SERIAL PRIMARY KEY,
                group_id INTEGER NOT NULL
                    REFERENCES groups(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL
                    REFERENCES users(id) ON DELETE CASCADE,
                can_create BOOLEAN NOT NULL DEFAULT FALSE,
                can_edit BOOLEAN NOT NULL DEFAULT FALSE,
                can_assign BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE
                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_group_members_group_user
                    UNIQUE (group_id, user_id)
            )
        """))

        # 3. Add the optional group reference to listings.
        # Existing listings remain personal listings.
        connection.execute(text("""
            ALTER TABLE listings
            ADD COLUMN IF NOT EXISTS group_id INTEGER
        """))

        # 4. Add the foreign key if it does not exist.
        connection.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'fk_listings_group_id'
                      AND conrelid = 'listings'::regclass
                ) THEN
                    ALTER TABLE listings
                    ADD CONSTRAINT fk_listings_group_id
                    FOREIGN KEY (group_id)
                    REFERENCES groups(id)
                    ON DELETE SET NULL;
                END IF;
            END
            $$;
        """))

        # 5. Create indexes for faster group lookups.
        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_groups_owner_id
            ON groups (owner_id)
        """))

        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_group_members_group_id
            ON group_members (group_id)
        """))

        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_group_members_user_id
            ON group_members (user_id)
        """))

        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_listings_group_id
            ON listings (group_id)
        """))

    print("Group database migration completed successfully!")


if __name__ == "__main__":
    migrate_groups()


from sqlalchemy import text

# Support both local development and Vercel deployment.
try:
    from backend.database import get_engine
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from database import get_engine


def migrate_moderation_audit():
    engine = get_engine()

    if engine.dialect.name != "postgresql":
        raise RuntimeError(
            "This migration is designed for PostgreSQL."
        )

    with engine.begin() as connection:

        # 1. Add moderation fields to existing listings.
        connection.execute(text("""
            ALTER TABLE listings
            ADD COLUMN IF NOT EXISTS moderation_status
                VARCHAR(20) NOT NULL DEFAULT 'visible',
            ADD COLUMN IF NOT EXISTS moderation_reason
                VARCHAR(500),
            ADD COLUMN IF NOT EXISTS moderated_at
                TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS moderated_by
                INTEGER REFERENCES users(id) ON DELETE SET NULL
        """))

        # 2. Restrict listing moderation status.
        connection.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'ck_listings_moderation_status'
                ) THEN
                    ALTER TABLE listings
                    ADD CONSTRAINT ck_listings_moderation_status
                    CHECK (
                        moderation_status IN ('visible', 'hidden')
                    );
                END IF;
            END $$;
        """))

        # 3. Create moderation index.
        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_listings_moderation_status
            ON listings (moderation_status)
        """))

        # 4. Create listing reports.
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS listing_reports (
                id SERIAL PRIMARY KEY,
                listing_id INTEGER NOT NULL
                    REFERENCES listings(id) ON DELETE CASCADE,
                reporter_id INTEGER NOT NULL
                    REFERENCES users(id) ON DELETE CASCADE,
                reason VARCHAR(50) NOT NULL,
                details VARCHAR(1000),
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                reviewed_by INTEGER
                    REFERENCES users(id) ON DELETE SET NULL,
                reviewed_at TIMESTAMP WITH TIME ZONE,
                resolution_note VARCHAR(1000),
                created_at TIMESTAMP WITH TIME ZONE
                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT ck_listing_reports_valid_status
                    CHECK (
                        status IN ('pending', 'resolved', 'dismissed')
                    )
            )
        """))

        # 5. Create report indexes.
        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_listing_reports_status_created
            ON listing_reports (status, created_at)
        """))

        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_listing_reports_listing_id
            ON listing_reports (listing_id)
        """))

        # 6. Create audit logs.
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                actor_id INTEGER
                    REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(80) NOT NULL,
                target_type VARCHAR(50) NOT NULL,
                target_id VARCHAR(64),
                details JSON,
                created_at TIMESTAMP WITH TIME ZONE
                    NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """))

        # 7. Create audit-log indexes.
        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at
            ON audit_logs (created_at)
        """))

        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_audit_logs_actor_id
            ON audit_logs (actor_id)
        """))

        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_audit_logs_action
            ON audit_logs (action)
        """))

    print("Moderation and audit migration completed successfully.")


if __name__ == "__main__":
    migrate_moderation_audit()


from sqlalchemy import text

# Support both local development and Vercel deployment
try:
    from backend.database import get_engine
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from database import get_engine


def migrate_refresh_tokens():
    engine = get_engine()

    with engine.begin() as connection:
        # Create refresh-token history table.
        connection.execute(
            text("""
                CREATE TABLE IF NOT EXISTS refresh_tokens (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(36) NOT NULL
                        REFERENCES user_sessions(id) ON DELETE CASCADE,
                    token_hash VARCHAR(64) NOT NULL UNIQUE,
                    created_at TIMESTAMP WITH TIME ZONE
                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    used_at TIMESTAMP WITH TIME ZONE,
                    revoked_at TIMESTAMP WITH TIME ZONE
                )
            """)
        )

        # Index refresh tokens by session.
        connection.execute(
            text("""
                CREATE INDEX IF NOT EXISTS
                ix_refresh_tokens_session_id
                ON refresh_tokens (session_id)
            """)
        )

        # Preserve existing sessions by recording their current
        # refresh-token hashes in the history table.
        connection.execute(
            text("""
                INSERT INTO refresh_tokens (
                    session_id,
                    token_hash,
                    created_at,
                    revoked_at
                )
                SELECT
                    id,
                    refresh_token_hash,
                    created_at,
                    revoked_at
                FROM user_sessions
                ON CONFLICT (token_hash) DO NOTHING
            """)
        )

    print("Refresh tokens migration completed.")


if __name__ == "__main__":
    migrate_refresh_tokens()

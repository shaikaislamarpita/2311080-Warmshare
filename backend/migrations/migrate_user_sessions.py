
from sqlalchemy import text

# Support both local development and Vercel deployment
try:
    from backend.database import get_engine
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from database import get_engine


def migrate_user_sessions():
    engine = get_engine()

    with engine.begin() as connection:
        # Create the user sessions table if it does not exist.
        connection.execute(
            text("""
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id INTEGER NOT NULL
                        REFERENCES users(id) ON DELETE CASCADE,
                    refresh_token_hash VARCHAR(64) NOT NULL UNIQUE,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE
                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    last_used_at TIMESTAMP WITH TIME ZONE
                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    revoked_at TIMESTAMP WITH TIME ZONE,
                    user_agent VARCHAR(500),
                    ip_address VARCHAR(45)
                )
            """)
        )

        # Index sessions by user.
        connection.execute(
            text("""
                CREATE INDEX IF NOT EXISTS
                ix_user_sessions_user_id
                ON user_sessions (user_id)
            """)
        )

        # Index sessions by expiration time.
        connection.execute(
            text("""
                CREATE INDEX IF NOT EXISTS
                ix_user_sessions_expires_at
                ON user_sessions (expires_at)
            """)
        )

    print("User sessions migration completed.")


if __name__ == "__main__":
    migrate_user_sessions()

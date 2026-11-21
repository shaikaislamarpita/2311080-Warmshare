from sqlalchemy import text

# Support both local development and Vercel deployment
try:
    from backend.database import get_engine
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from database import get_engine


def migrate_login_rate_limits():
    engine = get_engine()

    with engine.begin() as connection:
        connection.execute(
            text("""
                CREATE TABLE IF NOT EXISTS login_rate_limits (
                    identifier_hash VARCHAR(64) PRIMARY KEY,
                    failed_attempts INTEGER NOT NULL DEFAULT 0,
                    window_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    blocked_until TIMESTAMP WITH TIME ZONE,
                    updated_at TIMESTAMP WITH TIME ZONE
                        NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """)
        )

        connection.execute(
            text("""
                CREATE INDEX IF NOT EXISTS
                ix_login_rate_limits_blocked_until
                ON login_rate_limits (blocked_until)
            """)
        )

    print("Login rate limits migration completed.")


if __name__ == "__main__":
    migrate_login_rate_limits()


import os

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


def get_database_url():
    url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")

    if not url:
        raise RuntimeError(
            "Database URL missing. Set DATABASE_URL or POSTGRES_URL."
        )

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    if url.startswith("postgresql://"):
        url = url.replace(
            "postgresql://",
            "postgresql+psycopg://",
            1
        )

    # Remove the unsupported Supabase-specific connection option.
    parsed_url = make_url(url)
    query = dict(parsed_url.query)
    query.pop("supa", None)

    return parsed_url.set(query=query)


def get_engine():
    return create_engine(
        get_database_url(),
        pool_pre_ping=True,
    )


def get_session_factory():
    return sessionmaker(
        bind=get_engine(),
        autoflush=False,
        autocommit=False,
    )

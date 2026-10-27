
# Import the database connection and model definitions
try:
    from backend.database import Base, get_engine
    from backend import models
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise
    from database import Base, get_engine
    import models


def create_tables():
    # Connect to the database
    engine = get_engine()

    # Create tables that do not already exist
    Base.metadata.create_all(bind=engine)

    print("Database tables checked and created successfully!")


if __name__ == "__main__":
    create_tables()

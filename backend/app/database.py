import os

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()


class _ConnectionWrapper:
    """
    Thin wrapper around a psycopg2 connection so the rest of the app can
    keep calling `connection.cursor(dictionary=True)` exactly like it did
    with mysql-connector, instead of touching every call site in the
    routers. `dictionary=True` maps to psycopg2's RealDictCursor, which
    returns rows as plain dicts the same way mysql-connector's did.
    """

    def __init__(self, raw_connection):
        self._raw = raw_connection

    def cursor(self, dictionary=False):
        if dictionary:
            return self._raw.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        return self._raw.cursor()

    def commit(self):
        self._raw.commit()

    def rollback(self):
        self._raw.rollback()

    def close(self):
        self._raw.close()


def get_connection():
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        # Preferred for hosted Postgres (e.g. Neon, Supabase) — a single
        # connection string, usually already including `?sslmode=require`.
        raw_connection = psycopg2.connect(database_url)
    else:
        # Discrete vars — used for local development against a local
        # Postgres install.
        raw_connection = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", ""),
            dbname=os.getenv("DB_NAME", "granitos"),
            sslmode=os.getenv("DB_SSLMODE", "prefer")
        )

    return _ConnectionWrapper(raw_connection)

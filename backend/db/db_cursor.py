import os
from contextlib import contextmanager
from functools import lru_cache

from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool

from dotenv import load_dotenv
load_dotenv()


def _require(var_name: str) -> str:
    """
    Since os.getenv() returns None if the variable is not set, 
    this function raises an error if the variable is not set.
    """
    value = os.getenv(var_name)
    if value is None:
        raise ValueError(f"Environment variable {var_name} is required but not set.")
    return value


@lru_cache(maxsize=1)
def _get_pool() -> ThreadedConnectionPool:
    """
    Returns a ThreadedConnectionPool for PostgreSQL connections.
    The pool is cached to ensure that only one instance exists throughout the application.
    """
    return ThreadedConnectionPool(
        minconn=1,
        maxconn=10,
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=_require("DB_NAME"),
        user=_require("DB_USER"),
        password=_require("DB_PASSWORD"),
    )


@contextmanager
def db_cursor(commit=False):
    """
    Context manager for database cursor.
    Usage:

        from db.db_cursor import db_cursor

        with db_cursor(commit=True) as cur:
            cur.execute("SQL QUERY")
            
    """
    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            yield cur
        if commit:
            conn.commit()
        else:
            conn.rollback()  # closes the implicit transaction so the connection goes back clean
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def close_pool():
    """
    Call on app shutdown.
    """
    if _get_pool.cache_info().currsize:
        _get_pool().closeall()
        _get_pool.cache_clear()

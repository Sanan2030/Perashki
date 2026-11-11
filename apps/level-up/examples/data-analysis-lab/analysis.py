"""Synthetic CSV -> validated rows -> SQLite evidence. No third-party packages."""

import csv
import json
import math
from datetime import date
from pathlib import Path
import re
import sqlite3

HERE = Path(__file__).resolve().parent
ORDER_COLUMNS = ("order_id", "customer_id", "ordered_at", "status", "amount_cents")


def read_csv(path):
    with Path(path).open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def clean_orders(raw, customer_ids):
    """Remove exact repeats, quarantine invalid rows, reject conflicting IDs.

    This policy is specific to the fixture: there is no revision ordering that
    would justify choosing one of two conflicting rows for the same order.
    """
    seen_rows, seen_ids, valid, rejected = set(), {}, [], []
    duplicates = 0
    for line, row in enumerate(raw, start=2):
        if set(row) != set(ORDER_COLUMNS):
            raise ValueError("Order schema mismatch")
        signature = tuple(row[key] for key in ORDER_COLUMNS)
        if signature in seen_rows:
            duplicates += 1
            continue
        seen_rows.add(signature)
        key = row["order_id"]
        if key and key in seen_ids:
            raise ValueError(f"Conflicting order ID: {key}")
        if key:
            seen_ids[key] = signature
        reason = None
        if not key or row["customer_id"] not in customer_ids:
            reason = "missing order key or unknown customer"
        elif row["status"] not in {"paid", "cancelled"}:
            reason = "invalid status"
        elif not re.fullmatch(r"0|[1-9][0-9]*", row["amount_cents"] or ""):
            reason = "missing or invalid amount"
        else:
            try:
                parsed = date.fromisoformat(row["ordered_at"])
                if parsed.isoformat() != row["ordered_at"]:
                    raise ValueError("Noncanonical date")
            except (ValueError, TypeError):
                reason = "invalid ISO date"
        if reason:
            rejected.append({"line": line, "order_id": key, "reason": reason})
        else:
            valid.append({**row, "amount_cents": int(row["amount_cents"])})
    return valid, {
        "raw": len(raw), "exact_duplicates": duplicates,
        "quarantined": rejected, "retained": len(valid),
    }


def build_database(folder=HERE):
    folder = Path(folder)
    customers = read_csv(folder / "customers.csv")
    ids = [row["customer_id"] for row in customers]
    if any(not key for key in ids) or len(set(ids)) != len(ids):
        raise ValueError("Customer keys must be present and unique")
    orders, audit = clean_orders(read_csv(folder / "orders_raw.csv"), set(ids))
    db = sqlite3.connect(":memory:")
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    db.executescript("""
        CREATE TABLE customers (
            customer_id TEXT PRIMARY KEY, joined_at TEXT NOT NULL, country TEXT NOT NULL
        );
        CREATE TABLE orders (
            order_id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL REFERENCES customers(customer_id),
            ordered_at TEXT NOT NULL, status TEXT NOT NULL,
            amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0)
        );
        CREATE TABLE order_items (
            item_id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL REFERENCES orders(order_id),
            item_amount_cents INTEGER NOT NULL
        );
    """)
    db.executemany("INSERT INTO customers VALUES (:customer_id,:joined_at,:country)", customers)
    db.executemany("""INSERT INTO orders VALUES
        (:order_id,:customer_id,:ordered_at,:status,:amount_cents)""", orders)
    db.executemany("INSERT INTO order_items VALUES (:item_id,:order_id,:item_amount_cents)",
                   read_csv(folder / "order_items.csv"))
    return db, audit


def cohort_retention(db, complete_through="2026-03"):
    """First-paid cohorts; next calendar month, not rolling 30-day retention."""
    date.fromisoformat(complete_through + "-01")
    return [dict(row) for row in db.execute("""
        WITH first_paid AS (
            SELECT customer_id, substr(MIN(ordered_at),1,7) AS cohort
            FROM orders
            WHERE status='paid' AND substr(ordered_at,1,7) <= :cutoff
            GROUP BY customer_id
        ), members AS (
            SELECT customer_id, cohort,
                   substr(date(cohort || '-01','+1 month'),1,7) AS next_month
            FROM first_paid
        ), activity AS (
            SELECT DISTINCT customer_id, substr(ordered_at,1,7) AS month
            FROM orders WHERE status='paid' AND substr(ordered_at,1,7) <= :cutoff
        )
        SELECT m.cohort, COUNT(*) AS customers,
               CASE WHEN m.next_month <= :cutoff THEN COUNT(a.customer_id) END AS active_next,
               CASE WHEN m.next_month <= :cutoff
                    THEN 1.0 * COUNT(a.customer_id) / COUNT(*) END AS retention
        FROM members m
        LEFT JOIN activity a ON a.customer_id=m.customer_id AND a.month=m.next_month
        GROUP BY m.cohort, m.next_month ORDER BY m.cohort
    """, {"cutoff": complete_through})]


def approximate_ab_interval(success_a, n_a, success_b, n_b):
    """Unpooled normal approximation for an independent fixed-horizon exercise.

    Not for sparse samples, repeated peeking, clustered units or ratio metrics.
    """
    if n_a <= 0 or n_b <= 0 or not (0 <= success_a <= n_a and 0 <= success_b <= n_b):
        raise ValueError("Invalid binomial counts")
    p_a, p_b = success_a / n_a, success_b / n_b
    difference = p_b - p_a
    se = math.sqrt(p_a * (1 - p_a) / n_a + p_b * (1 - p_b) / n_b)
    return {"difference": difference, "lower": difference - 1.96 * se,
            "upper": difference + 1.96 * se}


def report(db, audit):
    monthly = [dict(row) for row in db.execute("""
        SELECT substr(ordered_at,1,7) AS month, SUM(amount_cents) AS paid_cents
        FROM orders WHERE status='paid' GROUP BY month ORDER BY month
    """)]
    return {
        "audit": audit,
        "paid_cents": db.execute("SELECT SUM(amount_cents) FROM orders WHERE status='paid'").fetchone()[0],
        "monthly": monthly, "first_paid_cohorts": cohort_retention(db),
        "ab_teaching_approximation": approximate_ab_interval(100, 1000, 120, 1000),
    }


if __name__ == "__main__":
    connection, cleaning_audit = build_database()
    try:
        print(json.dumps(report(connection, cleaning_audit), indent=2))
    finally:
        connection.close()

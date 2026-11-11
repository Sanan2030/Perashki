"""Optional pandas counterpart; compares independently aggregated totals to SQL."""

import pandas as pd
from analysis import HERE, build_database, clean_orders, read_csv, report


def main():
    customers = pd.read_csv(HERE / "customers.csv", dtype="string")
    clean, audit = clean_orders(read_csv(HERE / "orders_raw.csv"),
                                set(customers["customer_id"].dropna()))
    orders = pd.DataFrame(clean).astype({"customer_id": "string", "amount_cents": "Int64"})
    if orders["customer_id"].isna().any() or customers["customer_id"].isna().any():
        raise ValueError("Missing merge key")
    enriched = orders.merge(customers, on="customer_id", how="left",
                            validate="many_to_one", indicator=True)
    if not enriched["_merge"].eq("both").all():
        raise ValueError("Unmatched customer")
    paid = enriched.loc[enriched["status"].eq("paid")].copy()
    paid["month"] = pd.to_datetime(paid["ordered_at"], format="%Y-%m-%d").dt.strftime("%Y-%m")
    monthly = {month: int(amount) for month, amount in
               paid.groupby("month")["amount_cents"].sum().items()}
    db, sql_audit = build_database()
    try:
        reference = report(db, sql_audit)
    finally:
        db.close()
    assert audit == sql_audit
    assert int(paid["amount_cents"].sum()) == reference["paid_cents"] == 16500
    assert monthly == {row["month"]: row["paid_cents"] for row in reference["monthly"]}
    print({"pandas_paid_cents": int(paid["amount_cents"].sum()), "monthly": monthly})


if __name__ == "__main__":
    main()

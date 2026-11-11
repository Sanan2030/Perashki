import unittest
from analysis import (
    HERE, approximate_ab_interval, build_database, clean_orders,
    cohort_retention, read_csv, report,
)


class AnalysisContractTests(unittest.TestCase):
    def setUp(self):
        self.db, self.audit = build_database()
        self.addCleanup(self.db.close)

    def test_cleaning_reconciles_without_turning_missing_amount_into_zero(self):
        self.assertEqual(self.audit["raw"], 9)
        self.assertEqual(self.audit["exact_duplicates"], 1)
        self.assertEqual(self.audit["retained"], 7)
        self.assertEqual(self.audit["quarantined"], [
            {"line": 10, "order_id": "o8", "reason": "missing or invalid amount"},
        ])
        self.assertEqual(report(self.db, self.audit)["paid_cents"], 16500)

    def test_conflicting_duplicate_id_is_not_arbitrarily_dropped(self):
        rows = read_csv(HERE / "orders_raw.csv")
        conflict = {**rows[0], "amount_cents": "9999"}
        with self.assertRaisesRegex(ValueError, "Conflicting order ID: o1"):
            clean_orders(rows + [conflict], {"u1", "u2", "u3", "u4", "u5"})

    def test_left_join_preserves_nonbuyer_and_correct_denominator(self):
        rows = self.db.execute("""
            SELECT c.customer_id, COUNT(o.order_id)
            FROM customers c LEFT JOIN orders o
              ON o.customer_id=c.customer_id AND o.status='paid'
            GROUP BY c.customer_id ORDER BY c.customer_id
        """).fetchall()
        self.assertEqual([tuple(row) for row in rows],
                         [("u1", 2), ("u2", 1), ("u3", 2), ("u4", 1), ("u5", 0)])
        activated, eligible = self.db.execute("""
            SELECT COUNT(DISTINCT o.customer_id), COUNT(DISTINCT c.customer_id)
            FROM customers c LEFT JOIN orders o ON o.customer_id=c.customer_id
              AND o.status='paid' AND substr(o.ordered_at,1,7)='2026-02'
            WHERE substr(c.joined_at,1,7)='2026-02'
        """).fetchone()
        self.assertEqual((activated, eligible), (1, 2))

    def test_fanout_overstates_header_money_but_items_reconcile(self):
        naive, item_total = self.db.execute("""
            SELECT SUM(o.amount_cents), SUM(i.item_amount_cents)
            FROM orders o JOIN order_items i ON i.order_id=o.order_id
            WHERE o.status='paid'
        """).fetchone()
        self.assertEqual(naive, 17500)
        self.assertEqual(item_total, 16500)

    def test_explicit_window_and_cohort_observation_boundary(self):
        rows = self.db.execute("""
            SELECT order_id, SUM(amount_cents) OVER (
              PARTITION BY customer_id ORDER BY ordered_at, order_id
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
            FROM orders WHERE status='paid' ORDER BY customer_id, ordered_at, order_id
        """).fetchall()
        self.assertEqual([tuple(row) for row in rows],
                         [("o1", 1000), ("o2", 3000), ("o3", 3000),
                          ("o5", 4000), ("o6", 10000), ("o7", 500)])
        self.assertEqual(cohort_retention(self.db), [
            {"cohort": "2026-01", "customers": 2, "active_next": 1, "retention": 0.5},
            {"cohort": "2026-02", "customers": 1, "active_next": 1, "retention": 1.0},
            {"cohort": "2026-03", "customers": 1, "active_next": None, "retention": None},
        ])
        feb = cohort_retention(self.db, "2026-02")
        self.assertEqual(len(feb), 2)
        self.assertIsNone(feb[1]["retention"])

    def test_experiment_interval_includes_zero_despite_positive_lift(self):
        interval = approximate_ab_interval(100, 1000, 120, 1000)
        self.assertAlmostEqual(interval["difference"], 0.02)
        self.assertLess(interval["lower"], 0)
        self.assertGreater(interval["upper"], 0)
        self.assertAlmostEqual(interval["lower"], -0.00741199, places=6)
        with self.assertRaises(ValueError):
            approximate_ab_interval(10, 0, 12, 100)


if __name__ == "__main__":
    unittest.main()

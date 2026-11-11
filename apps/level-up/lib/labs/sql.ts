export type SqlCell = string | number | null;
export type SqlResult = { columns: string[]; rows: SqlCell[][]; truncated: boolean };
export type SqlExercise = {
  id: string;
  title: string;
  task: string;
  starter: string;
  hint: string;
  expected: Omit<SqlResult, 'truncated'>;
};

export const sqlExercises: SqlExercise[] = [
  {
    id: 'paid-revenue',
    title: 'Paid revenue',
    task: 'Return total revenue from paid orders only, in a column named paid_revenue_cents. Amounts are integer cents in one teaching currency.',
    starter: 'SELECT SUM(amount_cents) AS paid_revenue_cents\nFROM orders;',
    hint: "Filter status = 'paid' before aggregating. A cancelled order must not contribute.",
    expected: { columns: ['paid_revenue_cents'], rows: [[16500]] },
  },
  {
    id: 'all-customers',
    title: 'Include non-buyers',
    task: 'Return every customer_id and their paid_orders count, including customers with zero paid orders.',
    starter:
      "SELECT c.customer_id, COUNT(o.order_id) AS paid_orders\nFROM customers c\nJOIN orders o ON o.customer_id = c.customer_id\nWHERE o.status = 'paid'\nGROUP BY c.customer_id;",
    hint: 'Start from customers. Use LEFT JOIN and place the paid-status match condition in ON. Count order IDs, not COUNT(*).',
    expected: {
      columns: ['customer_id', 'paid_orders'],
      rows: [
        ['u1', 2],
        ['u2', 1],
        ['u3', 2],
        ['u4', 1],
        ['u5', 0],
      ],
    },
  },
  {
    id: 'join-grain',
    title: 'Repair join fanout',
    task: 'Using the order-to-item join, return paid revenue as paid_revenue_cents without repeating header amounts.',
    starter:
      "SELECT SUM(o.amount_cents) AS paid_revenue_cents\nFROM orders o\nJOIN order_items i ON i.order_id = o.order_id\nWHERE o.status = 'paid';",
    hint: 'Each joined row is an item. Sum item_amount_cents, or preserve one row per order before summing. SUM(DISTINCT amount) is not a general fix.',
    expected: { columns: ['paid_revenue_cents'], rows: [[16500]] },
  },
  {
    id: 'monthly',
    title: 'Monthly paid revenue',
    task: 'Return month (YYYY-MM) and paid_revenue_cents, one row per month, counting paid orders only.',
    starter:
      'SELECT substr(ordered_at, 1, 7) AS month,\n       SUM(amount_cents) AS paid_revenue_cents\nFROM orders\nGROUP BY substr(ordered_at, 1, 7)\nORDER BY month;',
    hint: 'Add the paid-status predicate. SQLite uses substr for these ISO-text fixture dates; this is not PostgreSQL date syntax.',
    expected: {
      columns: ['month', 'paid_revenue_cents'],
      rows: [
        ['2026-01', 4000],
        ['2026-02', 6000],
        ['2026-03', 6500],
      ],
    },
  },
  {
    id: 'running-total',
    title: 'Customer running totals',
    task: 'For paid orders, return order_id and customer_running_cents using a running total partitioned by customer_id. Use ordered_at and order_id for stable ordering.',
    starter:
      "SELECT order_id, amount_cents AS customer_running_cents\nFROM orders\nWHERE status = 'paid'\nORDER BY customer_id, ordered_at, order_id;",
    hint: 'Use SUM(amount_cents) OVER (PARTITION BY customer_id ORDER BY ordered_at, order_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW).',
    expected: {
      columns: ['order_id', 'customer_running_cents'],
      rows: [
        ['o1', 1000],
        ['o2', 3000],
        ['o3', 3000],
        ['o5', 4000],
        ['o6', 10000],
        ['o7', 500],
      ],
    },
  },
  {
    id: 'cohort-retention',
    title: 'Observed cohort retention',
    task: 'For first-paid cohorts, return cohort, customers, active_next and retention (a fraction). Data is complete through March 2026: March’s next-month activity and retention must be NULL, not zero.',
    starter:
      "WITH first_paid AS (\n  SELECT customer_id, substr(MIN(ordered_at), 1, 7) AS cohort\n  FROM orders WHERE status = 'paid'\n  GROUP BY customer_id\n)\nSELECT cohort, COUNT(*) AS customers,\n       NULL AS active_next, NULL AS retention\nFROM first_paid GROUP BY cohort ORDER BY cohort;",
    hint: "Build distinct paid customer/month activity. LEFT JOIN it to cohort members in the next calendar month, using substr(date(cohort || '-01', '+1 month'), 1, 7). Keep the full cohort denominator; if that month is after 2026-03, return NULL.",
    expected: {
      columns: ['cohort', 'customers', 'active_next', 'retention'],
      rows: [
        ['2026-01', 2, 1, 0.5],
        ['2026-02', 1, 1, 1],
        ['2026-03', 1, null, null],
      ],
    },
  },
];

export function checkSqlResult(
  result: SqlResult,
  exercise: SqlExercise,
): { correct: boolean; message: string } {
  if (
    result.rows.some((row) =>
      row.some((cell) => typeof cell === 'number' && !Number.isFinite(cell)),
    )
  ) {
    return { correct: false, message: 'Return finite numeric values before checking the result.' };
  }
  if (result.truncated)
    return {
      correct: false,
      message: 'The result was truncated. Return a smaller complete result before checking.',
    };
  const expected = exercise.expected;
  if (
    new Set(result.columns).size !== result.columns.length ||
    result.columns.length !== expected.columns.length ||
    expected.columns.some((column) => !result.columns.includes(column))
  ) {
    return { correct: false, message: `Use these result columns: ${expected.columns.join(', ')}.` };
  }
  const reordered = result.rows.map((row) =>
    expected.columns.map((column) => row[result.columns.indexOf(column)]),
  );
  const normalize = (rows: SqlCell[][]) => rows.map((row) => JSON.stringify(row)).sort();
  const correct = JSON.stringify(normalize(reordered)) === JSON.stringify(normalize(expected.rows));
  return {
    correct,
    message: correct
      ? 'Correct result for this dataset.'
      : `Not yet. Expected ${expected.rows.length} row(s). Check the grain, filters and denominator; then run the query again.`,
  };
}

# Data analysis lab

Run the same synthetic order analysis with SQLite and optionally pandas. No database server, account, credentials or application dependency changes are required. Use Python 3.10+ with SQLite window-function support (SQLite 3.25+).

From the repository root:

```sh
python3 examples/data-analysis-lab/analysis.py
python3 -m unittest discover -s examples/data-analysis-lab -p 'test_*.py' -v
```

The script reads local fixtures, builds an in-memory database, prints evidence and closes it. It makes no network calls or file changes. Customer IDs, dates and amounts are entirely synthetic. Money is integer cents in one unspecified teaching currency.

## Expected evidence

| Check                                   | Expected                          |
| --------------------------------------- | --------------------------------- |
| Raw order rows                          | 9                                 |
| Exact duplicates removed                | 1                                 |
| Invalid rows quarantined                | 1: missing amount on o8           |
| Valid unique orders                     | 7, including one cancelled order  |
| Paid orders                             | 6                                 |
| Paid revenue                            | 16,500 cents                      |
| January / February / March              | 4,000 / 6,000 / 6,500 cents       |
| Naive header sum after item join        | 17,500 cents: intentionally wrong |
| January month-one first-paid retention  | 1/2 = 50%                         |
| February month-one first-paid retention | 1/1 = 100%                        |
| March month-one retention               | Unobserved, not zero              |
| February signup activation              | 1/2 = 50%, a different population |

Data is complete through March 2026 for this exercise. A first-paid cohort starts in the first paid calendar month; month-one activity requires a paid order in the next calendar month. A cancelled order does not qualify. Exact repeats are removed; conflicting versions of an order ID raise an error rather than choosing arbitrarily. Invalid required values are quarantined with reasons. These policies are part of the teaching contract, not universal business rules.

## Optional pandas comparison

Use an isolated environment; installation needs access to a Python package index:

```sh
python3 -m venv /tmp/level-up-data-lab
/tmp/level-up-data-lab/bin/pip install -r examples/data-analysis-lab/requirements.txt
/tmp/level-up-data-lab/bin/python examples/data-analysis-lab/pandas_analysis.py
```

The pandas implementation reuses the explicit cleaning policy, validates a many-to-one merge and independently aggregates the cleaned rows. It reconciles results against SQLite. It rejects missing merge keys because pandas can otherwise match null keys to one another, which differs from ordinary SQL equality joins.

## Exercises

1. Write a customer-to-paid-orders left join that retains u5. Move the status filter from ON to WHERE and explain the changed population.
2. Join orders to items and reproduce the incorrect header sum. Fix it by using item-level amounts or preserving order grain; explain why SUM(DISTINCT amount) is unsafe.
3. Calculate each customer's running paid amount with an explicit ROWS frame and stable ordering. Consider what an equal timestamp means.
4. Change the observation cutoff to February in `cohort_retention`. February's next-month result must become unobserved and March must not appear.
5. In a temporary fixture copy, add a conflicting version of o1 or a duplicate customer key. The analysis must fail rather than multiply revenue silently.
6. Review the A/B approximation: 100/1000 versus 120/1000 gives +2 percentage points, +20% relative lift, and an approximate 95% difference interval of -0.74 to +4.74 percentage points. List why this is insufficient for a production experiment decision.

`approximate_ab_interval` is an original unpooled normal approximation for independent, fixed-horizon binomial outcomes. It is unsuitable as a general method for sparse events, clustered observations, sequential peeking or arbitrary ratio metrics. No production inference library or randomization service is provided.

SQLite uses ISO date text and `substr`/`date` in these queries. PostgreSQL's date functions differ. Excel/Power BI modeling exercises in the lessons have expected reconciliation values but are not executed by this lab.

Sources and selected-reading limitations are recorded in [the research note](../../docs/RESEARCH-2026-10-23.md). The related lessons are available under **Lesson library → Subject → Data analysis**.

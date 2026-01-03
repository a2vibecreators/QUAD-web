import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// Database book content
const bookContent = `
================================================================================
                    RELATIONAL DATABASE FOR THE AI ERA
                            Version 1.0

                  Includes QUAD Framework Chapters

                        A2Vibe Creators
================================================================================

Table of Contents

Part I: Database Fundamentals (Chapters 1-8)
  Chapter 1: The AI Database Paradox
  Chapter 2: Relational Model & Normalization
  Chapter 3: SQL Foundations
  Chapter 4: Joins & Relationships
  Chapter 5: Indexes & Performance
  Chapter 6: Transactions & ACID
  Chapter 7: Advanced SQL
  Chapter 8: Database Design Patterns

Part II: Working with AI (Chapters 9-10)
  Chapter 9: Prompting AI for SQL
  Chapter 10: Reviewing AI Database Output

Part III: QUAD Framework (Chapters 11-12)
  Chapter 11: The QUAD Framework
  Chapter 12: Practical QUAD Workflows for Database

================================================================================

CHAPTER 1: THE AI DATABASE PARADOX
================================================================================

> "AI can generate any SQL query in seconds. But it can't understand YOUR data,
> YOUR relationships, or YOUR performance requirements."

The Paradox

AI can generate complex SQL queries instantly. Yet that same AI:
- Creates N+1 query nightmares
- Ignores existing indexes
- Misses foreign key relationships
- Generates SQL injection vulnerabilities
- Chooses wrong data types for your use case

The paradox: The faster AI generates SQL, the more you need to understand databases.

Real Disasters

DISASTER #1: The E-Commerce Meltdown
A startup used AI to generate product catalog queries. The AI created:
  SELECT * FROM products
  WHERE category_id IN (SELECT id FROM categories WHERE parent_id = ?)

Looks fine? In production with 1M products:
- Full table scan every time
- 30-second query times during Black Friday
- Site went down, lost $500K in sales

The Fix Required Understanding:
  - The query needed an index on category_id
  - Should use JOIN instead of subquery
  - Should SELECT only needed columns, not *

DISASTER #2: The Data Corruption
An AI generated INSERT/UPDATE statements without understanding constraints:
  UPDATE accounts SET balance = balance - 1000 WHERE user_id = 123;
  UPDATE accounts SET balance = balance + 1000 WHERE user_id = 456;

No transaction! System crashed between statements. $1000 vanished.

The Core Truth

AI is a powerful amplifier for database work:
- Know databases deeply -> AI makes you 10x faster
- Don't know databases -> AI creates 10x more disasters

================================================================================

CHAPTER 2: RELATIONAL MODEL & NORMALIZATION
================================================================================

> "Normalization isn't about theory. It's about preventing the data disasters
> that AI will happily create for you."

Why This Matters for AI

AI often generates denormalized schemas because they're "simpler":
  CREATE TABLE orders (
    id INT PRIMARY KEY,
    customer_name VARCHAR(100),    -- Denormalized!
    customer_email VARCHAR(100),   -- Denormalized!
    customer_phone VARCHAR(20),    -- Denormalized!
    product_name VARCHAR(100),     -- Denormalized!
    product_price DECIMAL(10,2),   -- Denormalized!
    quantity INT
  );

Problems with AI's approach:
- Customer changes email? Update EVERY order
- Product price changes? Historical orders corrupted
- Storage bloat from repeated data

Normalized Design:

  -- Customers table
  CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20)
  );

  -- Products table
  CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL
  );

  -- Orders table (references, not copies)
  CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Order items (captures price AT TIME of order)
  CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL  -- Price when ordered
  );

The Three Normal Forms (Simplified)

1NF: No repeating groups
  BAD:  phone1, phone2, phone3 columns
  GOOD: Separate phones table

2NF: No partial dependencies
  BAD:  order_items with customer_name (depends on order, not order_item)
  GOOD: customer_name only in customers table

3NF: No transitive dependencies
  BAD:  orders with city and city_state (state depends on city)
  GOOD: Separate cities table with state

================================================================================

CHAPTER 3: SQL FOUNDATIONS
================================================================================

> "SELECT * is the red flag that tells you AI doesn't understand your schema."

The Four SQL Categories

1. DDL - Data Definition Language
   CREATE, ALTER, DROP, TRUNCATE

2. DML - Data Manipulation Language
   SELECT, INSERT, UPDATE, DELETE

3. DCL - Data Control Language
   GRANT, REVOKE

4. TCL - Transaction Control Language
   BEGIN, COMMIT, ROLLBACK, SAVEPOINT

SELECT: The Most Common (and Most Abused)

AI loves to generate:
  SELECT * FROM users WHERE status = 'active';

Problems:
- Fetches columns you don't need
- Breaks if schema changes
- Kills query cache efficiency
- Exposes sensitive data accidentally

Better:
  SELECT id, email, full_name, created_at
  FROM users
  WHERE status = 'active'
  ORDER BY created_at DESC
  LIMIT 50;

INSERT: Safe Patterns

AI generates:
  INSERT INTO users VALUES ('uuid', 'john@email.com', 'John', 'active');

Problems:
- Breaks if column order changes
- No explicit column mapping
- Hard to maintain

Better:
  INSERT INTO users (email, full_name, status)
  VALUES ('john@email.com', 'John', 'active')
  RETURNING id, created_at;

UPDATE: The Danger Zone

AI generates:
  UPDATE users SET status = 'inactive';  -- No WHERE clause!

This updates EVERY row. Always require:
  UPDATE users
  SET status = 'inactive', updated_at = NOW()
  WHERE id = 'specific-uuid'
  RETURNING *;

DELETE: Even More Dangerous

Rule: Never DELETE without WHERE and confirmation:
  -- Check first
  SELECT COUNT(*) FROM orders WHERE created_at < '2020-01-01';

  -- Then delete
  DELETE FROM orders
  WHERE created_at < '2020-01-01'
  RETURNING id;

================================================================================

CHAPTER 4: JOINS & RELATIONSHIPS
================================================================================

> "AI picks the wrong JOIN type 60% of the time. Know when to use each."

The Four Join Types

1. INNER JOIN - Only matching rows
   SELECT o.id, c.name
   FROM orders o
   INNER JOIN customers c ON o.customer_id = c.id;

   Result: Only orders WITH customers

2. LEFT JOIN - All left rows + matching right
   SELECT c.name, COUNT(o.id) as order_count
   FROM customers c
   LEFT JOIN orders o ON c.id = o.customer_id
   GROUP BY c.id, c.name;

   Result: ALL customers, even those with 0 orders

3. RIGHT JOIN - All right rows + matching left
   (Rarely used - just reverse the LEFT JOIN)

4. FULL OUTER JOIN - All rows from both
   SELECT c.name, o.id
   FROM customers c
   FULL OUTER JOIN orders o ON c.id = o.customer_id;

   Result: All customers AND all orders (with NULLs for non-matches)

Common AI Mistakes

MISTAKE 1: Using INNER when LEFT is needed
  -- AI generates (misses customers with no orders)
  SELECT c.name, o.total
  FROM customers c
  INNER JOIN orders o ON c.id = o.customer_id;

  -- Should be
  SELECT c.name, COALESCE(SUM(o.total), 0) as total_spent
  FROM customers c
  LEFT JOIN orders o ON c.id = o.customer_id
  GROUP BY c.id, c.name;

MISTAKE 2: Cartesian products (missing JOIN condition)
  -- AI generates (DISASTER - multiplies rows)
  SELECT * FROM products, categories;

  -- Should be
  SELECT p.*, c.name as category_name
  FROM products p
  JOIN categories c ON p.category_id = c.id;

MISTAKE 3: Multiple joins without thinking
  -- AI generates (5 joins, massive query)
  SELECT *
  FROM orders o
  JOIN customers c ON o.customer_id = c.id
  JOIN addresses a ON c.id = a.customer_id
  JOIN order_items oi ON o.id = oi.order_id
  JOIN products p ON oi.product_id = p.id
  JOIN categories cat ON p.category_id = cat.id;

  -- Ask: Do you NEED all this data at once?

================================================================================

CHAPTER 5: INDEXES & PERFORMANCE
================================================================================

> "AI never suggests indexes. That's your job."

Why Indexes Matter

Without index (Full Table Scan):
  SELECT * FROM users WHERE email = 'john@example.com';
  -- Checks ALL 10 million rows: 30 seconds

With index:
  CREATE INDEX idx_users_email ON users(email);
  -- B-tree lookup: 1 millisecond

Index Types

1. B-Tree (Default) - For equality and range
   CREATE INDEX idx_orders_date ON orders(created_at);
   Good for: =, <, >, <=, >=, BETWEEN, ORDER BY

2. Hash - For equality only (PostgreSQL)
   CREATE INDEX idx_users_email ON users USING HASH(email);
   Good for: = only (faster than B-tree for exact match)

3. GIN - For arrays and full-text
   CREATE INDEX idx_products_tags ON products USING GIN(tags);
   Good for: Array contains, full-text search

4. Partial - For filtered subsets
   CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;
   Good for: Queries that always filter by condition

When AI Gets It Wrong

AI generates queries without thinking about indexes:
  SELECT * FROM products
  WHERE LOWER(name) LIKE '%phone%'
  AND category_id = 5
  AND price BETWEEN 100 AND 500;

Problems:
- LOWER(name) prevents index use on name
- LIKE '%phone%' can't use index (leading wildcard)
- Need composite index for category + price

Fixed:
  -- Create proper index
  CREATE INDEX idx_products_cat_price ON products(category_id, price);

  -- Use full-text search instead of LIKE
  CREATE INDEX idx_products_name_gin ON products USING GIN(to_tsvector('english', name));

  SELECT * FROM products
  WHERE to_tsvector('english', name) @@ to_tsquery('phone')
  AND category_id = 5
  AND price BETWEEN 100 AND 500;

EXPLAIN ANALYZE: Your Best Friend

ALWAYS check AI-generated queries:
  EXPLAIN ANALYZE
  SELECT * FROM orders WHERE customer_id = 'uuid';

Look for:
- "Seq Scan" = No index (BAD for large tables)
- "Index Scan" = Using index (GOOD)
- "Bitmap Index Scan" = Combining multiple indexes (OK)
- "Rows" estimate vs actual = Stale statistics?

================================================================================

CHAPTER 6: TRANSACTIONS & ACID
================================================================================

> "AI generates single statements. Real systems need transactions."

ACID Properties

A - Atomicity: All or nothing
C - Consistency: Valid state to valid state
I - Isolation: Concurrent transactions don't interfere
D - Durability: Committed data survives crashes

The Bank Transfer Example

AI generates:
  UPDATE accounts SET balance = balance - 100 WHERE id = 'sender';
  UPDATE accounts SET balance = balance + 100 WHERE id = 'receiver';

What if system crashes between statements?

With Transaction:
  BEGIN;

  UPDATE accounts SET balance = balance - 100
  WHERE id = 'sender' AND balance >= 100;

  IF NOT FOUND THEN
    ROLLBACK;
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  UPDATE accounts SET balance = balance + 100
  WHERE id = 'receiver';

  COMMIT;

Isolation Levels

From least to most strict:

1. READ UNCOMMITTED - See uncommitted changes (dangerous)
2. READ COMMITTED - See only committed changes (PostgreSQL default)
3. REPEATABLE READ - Same query = same results in transaction
4. SERIALIZABLE - Full isolation (slowest)

For financial data:
  BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  -- Critical operations here
  COMMIT;

Deadlock Prevention

AI doesn't think about lock order:
  -- Transaction 1
  UPDATE accounts SET balance = balance - 100 WHERE id = 'A';
  UPDATE accounts SET balance = balance + 100 WHERE id = 'B';

  -- Transaction 2 (concurrent)
  UPDATE accounts SET balance = balance - 50 WHERE id = 'B';
  UPDATE accounts SET balance = balance + 50 WHERE id = 'A';

DEADLOCK! Both waiting for each other.

Fix: Always lock in consistent order:
  -- Always lock lower ID first
  UPDATE accounts SET balance = balance + CASE id
    WHEN 'A' THEN -100
    WHEN 'B' THEN 100
  END
  WHERE id IN ('A', 'B')
  ORDER BY id;

================================================================================

CHAPTER 7: ADVANCED SQL
================================================================================

> "AI knows basic SQL. Complex queries require human design."

Common Table Expressions (CTEs)

For readable, maintainable queries:

  WITH monthly_sales AS (
    SELECT
      DATE_TRUNC('month', created_at) as month,
      SUM(total) as revenue
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '1 year'
    GROUP BY 1
  ),
  growth AS (
    SELECT
      month,
      revenue,
      LAG(revenue) OVER (ORDER BY month) as prev_revenue
    FROM monthly_sales
  )
  SELECT
    month,
    revenue,
    ROUND((revenue - prev_revenue) / prev_revenue * 100, 2) as growth_pct
  FROM growth
  ORDER BY month;

Window Functions

AI often uses subqueries where window functions are better:

  -- AI generates (slow)
  SELECT id, total,
    (SELECT SUM(total) FROM orders o2 WHERE o2.customer_id = o1.customer_id) as customer_total
  FROM orders o1;

  -- Better with window function
  SELECT id, total,
    SUM(total) OVER (PARTITION BY customer_id) as customer_total
  FROM orders;

Common Window Functions:
  ROW_NUMBER() - Unique row numbers
  RANK()       - Ranking with gaps
  DENSE_RANK() - Ranking without gaps
  LAG/LEAD     - Previous/next row values
  SUM/AVG OVER - Running totals/averages

Recursive CTEs

For hierarchical data (org charts, categories):

  WITH RECURSIVE category_tree AS (
    -- Base case: top-level categories
    SELECT id, name, parent_id, 0 as depth, name as path
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    -- Recursive case: children
    SELECT c.id, c.name, c.parent_id, ct.depth + 1,
           ct.path || ' > ' || c.name
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
  )
  SELECT * FROM category_tree ORDER BY path;

================================================================================

CHAPTER 8: DATABASE DESIGN PATTERNS
================================================================================

> "Good schema design prevents 90% of the problems AI will create."

Pattern 1: Soft Deletes

Never actually delete:
  ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
  ALTER TABLE users ADD COLUMN deleted_by UUID;

  -- "Delete"
  UPDATE users SET deleted_at = NOW(), deleted_by = current_user_id
  WHERE id = 'uuid';

  -- All queries need filter
  SELECT * FROM users WHERE deleted_at IS NULL;

Pattern 2: Audit Trails

Track all changes:
  CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMP DEFAULT NOW()
  );

Pattern 3: Event Sourcing (for critical data)

Store events, not state:
  CREATE TABLE account_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- DEPOSIT, WITHDRAWAL, TRANSFER
    amount DECIMAL(10,2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Current balance = SUM of all events
  SELECT account_id, SUM(
    CASE event_type
      WHEN 'DEPOSIT' THEN amount
      WHEN 'WITHDRAWAL' THEN -amount
    END
  ) as balance
  FROM account_events
  GROUP BY account_id;

Pattern 4: EAV (Entity-Attribute-Value)

For flexible schemas:
  CREATE TABLE resource_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id),
    attribute_name VARCHAR(50) NOT NULL,
    attribute_value TEXT,
    UNIQUE(resource_id, attribute_name)
  );

Use when: Schema varies by resource type
Avoid when: You know all attributes upfront

================================================================================

CHAPTER 9: PROMPTING AI FOR SQL
================================================================================

> "The quality of AI-generated SQL depends entirely on how you describe your
> schema and requirements."

The Schema-First Prompt

BAD prompt:
  "Write a query to get user orders"

GOOD prompt:
  "Given these tables:
  - users (id UUID, email VARCHAR, created_at TIMESTAMP)
  - orders (id UUID, user_id UUID FK->users, total DECIMAL, status VARCHAR, created_at)
  - order_items (id UUID, order_id UUID FK->orders, product_id UUID, quantity INT, price DECIMAL)

  Write a query to get:
  - User email
  - Total number of orders
  - Total amount spent
  - Average order value
  For users who signed up in the last 30 days
  Sorted by total spent descending"

Include Constraints

Tell AI about:
  "Constraints:
  - users.email has UNIQUE index
  - orders.user_id has btree index
  - orders.created_at has btree index
  - Table has 10M orders, 1M users
  - Query should complete in < 100ms"

Specify Edge Cases

  "Handle edge cases:
  - Users with no orders (include with 0 totals)
  - Null values in order totals (treat as 0)
  - Deleted users (exclude where deleted_at IS NOT NULL)"

================================================================================

CHAPTER 10: REVIEWING AI DATABASE OUTPUT
================================================================================

> "Trust but verify. Every AI-generated query needs human review."

The SQL Review Checklist

□ Performance
  - Are appropriate columns indexed?
  - Run EXPLAIN ANALYZE
  - No SELECT *
  - No functions on indexed columns in WHERE

□ Correctness
  - JOIN types correct?
  - NULL handling with COALESCE?
  - Date/timezone handling?
  - Decimal vs float for money?

□ Security
  - Parameterized queries (no string concatenation)?
  - No SQL injection vectors?
  - Appropriate column exposure?

□ Transactions
  - Multi-statement operations wrapped?
  - Proper isolation level?
  - Deadlock prevention?

□ Edge Cases
  - Empty results handled?
  - Division by zero prevented?
  - Overflow possible?

Red Flags in AI SQL

1. SELECT * - Always specify columns
2. No LIMIT - Could return millions of rows
3. LIKE '%x%' - Leading wildcard kills indexes
4. No indexes mentioned - AI doesn't create them
5. Multiple subqueries - Often replaceable with JOINs
6. No transaction - Multi-statement needs wrapping
7. Hard-coded values - Should be parameters

================================================================================

CHAPTER 11: THE QUAD FRAMEWORK — Organizing Database Work
================================================================================

> "You can generate SQL with AI. But who designs the schema? Who reviews
> the queries? Who ensures data integrity? That's where QUAD comes in."

Database Work in QUAD

The four stages for database work:

  Q → U → A → D
  Question → Understand → Allocate → Deliver

| Stage | Database Focus                  | Key Question                    |
|-------|---------------------------------|---------------------------------|
| Q     | Data requirements gathering     | "What data do we need to store?"|
| U     | Schema design, normalization    | "How should we structure it?"   |
| A     | Assign DBA, backend tasks       | "Who implements what?"          |
| D     | Migrations, queries, testing    | "Is it correct and fast?"       |

The Database Adoption Matrix

                    SKILL LEVEL
                Low      Medium     High
           +---------+---------+---------+
      High |Simple   |Complex  |Schema   |
           |Queries  |Queries  |Design   |
TRUST -----+---------+---------+---------+
LEVEL Med  |SELECT   |JOINs    |Indexes  |
           |Only     |CTEs     |Tuning   |
      -----+---------+---------+---------+
      Low  |Read     |Read/    |Full     |
           |Only     |Write    |DBA      |
           +---------+---------+---------+

Database Circles

1. Management Circle - Data requirements, business rules
2. Development Circle - Query implementation, ORM setup
3. QA Circle - Data validation, migration testing
4. Infrastructure Circle - Backups, replication, monitoring

================================================================================

CHAPTER 12: PRACTICAL QUAD WORKFLOWS FOR DATABASE
================================================================================

> "Database work isn't just writing queries. It's a structured process from
> requirements to production data."

Workflow 1: New Feature Database Setup

Q Stage (Question):
  - What entities are involved?
  - What relationships exist?
  - What are the access patterns?
  - What's the data volume expected?

U Stage (Understand):
  - Design normalized schema
  - Identify indexes needed
  - Plan migrations
  - Consider performance implications

A Stage (Allocate):
  - DBA: Schema review, index strategy
  - Backend: Migration files, ORM models
  - QA: Test data preparation

D Stage (Deliver):
  - Create migration files
  - Review with EXPLAIN ANALYZE
  - Test with realistic data volumes
  - Deploy with rollback plan

Workflow 2: Query Optimization

1. Identify slow query (monitoring)
2. Run EXPLAIN ANALYZE
3. Check index usage
4. Consider query rewrite
5. Add/modify indexes if needed
6. Verify improvement
7. Document changes

Workflow 3: Database Review Checklist

Before any PR with database changes:
  [ ] Schema follows normalization rules
  [ ] Indexes exist for query patterns
  [ ] Migrations are reversible
  [ ] Constraints enforce data integrity
  [ ] No breaking changes to existing data
  [ ] Performance tested with realistic data

================================================================================

KEY TAKEAWAYS
================================================================================

After reading this book, you can:

1. ✅ Understand normalization deeply enough to catch AI denormalization
2. ✅ Write proper SQL (not SELECT *)
3. ✅ Know when AI should use LEFT vs INNER JOIN
4. ✅ Design and implement appropriate indexes
5. ✅ Use transactions correctly for data integrity
6. ✅ Write window functions and CTEs
7. ✅ Review AI-generated SQL for security and performance
8. ✅ Apply database design patterns (soft deletes, audit trails)
9. ✅ Understand your role in a QUAD-organized database team
10. ✅ Execute database work end-to-end through Q-U-A-D stages

================================================================================

For the complete book with all 12 chapters, code examples, and detailed
workflows, visit: https://quadframe.work/book

QUAD Framework: https://quadframe.work
Source Code: https://github.com/sumanaddanki/books

================================================================================
                    (C) 2024-2025 A2Vibe Creators
                    Relational Database for the AI Era - Version 1.0
================================================================================
`;

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Log download (for analytics)
    console.log(`Database book download by: ${session.user.email} at ${new Date().toISOString()}`);

    // Create text file response
    const encoder = new TextEncoder();
    const bookBuffer = encoder.encode(bookContent);

    // Return as downloadable text file
    return new NextResponse(bookBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="Database-for-the-AI-Era-QUAD.txt"',
        'Content-Length': bookBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Database book download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}

// GET for info
export async function GET(req: NextRequest) {
  return NextResponse.json({
    title: 'Relational Database for the AI Era',
    version: '1.0',
    chapters: 12,
    format: 'txt',
    requiresAuth: true,
    includes: [
      'Database fundamentals for AI era',
      'SQL patterns and anti-patterns',
      'Index and performance tuning',
      'Transaction and ACID principles',
      'AI prompting for SQL',
      'QUAD Framework for database work',
    ],
  });
}

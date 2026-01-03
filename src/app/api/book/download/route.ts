import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// Book content - chapters from the book
const bookContent = `
================================================================================
                        JAVA FOR THE AI ERA
                            Version 3.0

                  Includes QUAD Framework Chapters

                        A2Vibe Creators
================================================================================

Table of Contents

Part I: Java Fundamentals (Chapters 1-8)
  Chapter 1: The AI Paradox
  Chapter 2: Java Types & Generics
  Chapter 3: Control Flow & Streams
  Chapter 4: OOP Foundations
  Chapter 5: OOP Pillars & SOLID
  Chapter 6: Error Handling
  Chapter 7: Collections Framework
  Chapter 8: Modern Java Features

Part II: Working with AI (Chapters 9-10)
  Chapter 9: Prompting AI for Java
  Chapter 10: Reviewing AI Java Output

Part III: QUAD Framework (Chapters 11-12)
  Chapter 11: The QUAD Framework
  Chapter 12: Practical QUAD Workflows

================================================================================

CHAPTER 1: THE AI PARADOX
================================================================================

> "You don't need to memorize syntax. But you absolutely need to understand
> concepts—because AI doesn't."

The Paradox

AI can generate thousands of lines of Java code in seconds. Yet that same AI:
- Creates NullPointerException landmines
- Ignores your existing class hierarchies
- Picks wrong collection types for your use case
- Misses thread safety issues entirely

The paradox: The faster AI generates code, the more you need to understand Java.

Real Disasters

DISASTER #1: The Healthcare App Crash
A startup used AI to generate patient data processing. The AI created code that
worked perfectly in tests. In production with 10,000 concurrent users:
- Memory leaks from unclosed database connections
- Race conditions corrupting patient records
- The app crashed during a critical procedure

DISASTER #2: The Financial Calculation
An AI generated BigDecimal calculations for a trading platform:
  double price = 19.99;
  double quantity = 3;
  double total = price * quantity; // AI used double, not BigDecimal

Result: Off by fractions of cents. Over millions of transactions = millions lost.

DISASTER #3: The Security Breach
AI generated a login system:
  String query = "SELECT * FROM users WHERE email = '" + email + "'";

Classic SQL injection vulnerability. The company was breached within a week.

The Core Truth

AI is a powerful amplifier. It amplifies both your productivity AND your mistakes.
- Know Java deeply -> AI makes you 10x faster
- Don't know Java -> AI makes you 10x more dangerous

================================================================================

CHAPTER 2: JAVA TYPES & GENERICS
================================================================================

> "AI confuses primitives and objects constantly. This causes NullPointerExceptions
> that are impossible to debug."

Primitives vs Objects

Primitives (stored by value):
  int count = 5;        // Cannot be null
  boolean active = true; // Cannot be null
  double price = 19.99;  // Cannot be null

Objects (stored by reference):
  Integer count = null;   // CAN be null!
  Boolean active = null;  // CAN be null!
  String name = null;     // CAN be null!

AI Mistake: Autoboxing Trap
  // AI generates
  Integer total = null;
  int result = total + 5;  // NullPointerException!

  // Should be
  Integer total = null;
  int result = (total != null) ? total + 5 : 5;

  // Or use Optional
  Optional<Integer> total = Optional.empty();
  int result = total.orElse(0) + 5;

Generics

AI often generates raw types (dangerous):
  // BAD - AI does this
  List users = new ArrayList();
  users.add("John");
  users.add(123);  // No compile error, runtime disaster

  // GOOD - Type-safe
  List<User> users = new ArrayList<>();
  users.add(new User("John")); // Only User objects allowed

Generic Methods
  // AI often forgets type bounds
  public <T extends Comparable<T>> T findMax(List<T> items) {
    return items.stream()
        .max(Comparable::compareTo)
        .orElseThrow();
  }

Wildcard Types
  // Producer - use extends
  void processUsers(List<? extends User> users) {
    for (User u : users) { /* read only */ }
  }

  // Consumer - use super
  void addUsers(List<? super User> users) {
    users.add(new User("John")); // write only
  }

  // PECS: Producer Extends, Consumer Super

================================================================================

CHAPTER 3: CONTROL FLOW & STREAMS
================================================================================

> "AI generates verbose loops when streams are better, and streams when loops
> are clearer. Know when to use each."

When to Use Loops

Use traditional loops for:
- Early termination with complex conditions
- Index-based operations
- Modifying the collection being iterated
- Simple operations where streams add overhead

  // Loop is clearer here
  for (int i = 0; i < items.size(); i++) {
    if (items.get(i).isInvalid()) {
      items.remove(i);
      i--; // Adjust index after removal
    }
  }

When to Use Streams

Use streams for:
- Filtering, mapping, reducing
- Chained transformations
- Parallel processing
- Functional-style operations

  // Stream is cleaner here
  List<String> activeUserEmails = users.stream()
      .filter(User::isActive)
      .map(User::getEmail)
      .sorted()
      .collect(Collectors.toList());

AI Stream Mistakes

MISTAKE 1: Side effects in streams
  // BAD - AI does this
  List<User> results = new ArrayList<>();
  users.stream().forEach(u -> results.add(u)); // Side effect!

  // GOOD
  List<User> results = users.stream().collect(Collectors.toList());

MISTAKE 2: Reusing streams
  // BAD - Stream already consumed
  Stream<User> stream = users.stream();
  long count = stream.count();
  List<User> list = stream.collect(Collectors.toList()); // Exception!

  // GOOD - Create new stream
  long count = users.stream().count();
  List<User> list = users.stream().collect(Collectors.toList());

MISTAKE 3: Using streams for simple operations
  // Overkill
  boolean found = users.stream().anyMatch(u -> u.getId().equals(id));

  // Sometimes a simple loop is clearer for debugging
  for (User u : users) {
    if (u.getId().equals(id)) return true;
  }
  return false;

================================================================================

CHAPTER 4: OOP FOUNDATIONS
================================================================================

> "AI generates flat code with everything public. Real Java uses proper
> encapsulation and hierarchies."

Classes and Objects

A class is a blueprint; an object is an instance.

  public class User {
    // Private fields (encapsulation)
    private final String id;
    private String email;
    private boolean active;

    // Constructor
    public User(String id, String email) {
      this.id = Objects.requireNonNull(id, "id cannot be null");
      this.email = Objects.requireNonNull(email, "email cannot be null");
      this.active = true;
    }

    // Getters (read access)
    public String getId() { return id; }
    public String getEmail() { return email; }
    public boolean isActive() { return active; }

    // Setters (controlled write access)
    public void setEmail(String email) {
      this.email = Objects.requireNonNull(email);
    }

    public void deactivate() {
      this.active = false;
    }
  }

AI Mistakes with Classes

MISTAKE 1: Everything public
  // BAD - AI does this
  public class User {
    public String id;     // Anyone can modify!
    public String email;  // No validation!
  }

MISTAKE 2: No null checks
  // BAD
  public User(String id, String email) {
    this.id = id;  // Could be null
  }

  // GOOD
  public User(String id, String email) {
    this.id = Objects.requireNonNull(id, "id required");
  }

MISTAKE 3: Mutable fields exposed
  // BAD
  public List<Order> getOrders() {
    return orders; // Caller can modify!
  }

  // GOOD
  public List<Order> getOrders() {
    return Collections.unmodifiableList(orders);
  }

Interfaces vs Abstract Classes

Interface: Contract for what a class CAN DO
  public interface Payable {
    void processPayment(BigDecimal amount);
  }

Abstract Class: Partial implementation for what a class IS
  public abstract class Employee {
    protected String name;

    public abstract BigDecimal calculateSalary();

    public void printDetails() {
      System.out.println(name + ": " + calculateSalary());
    }
  }

================================================================================

CHAPTER 5: OOP PILLARS & SOLID
================================================================================

> "AI generates code that works but violates every design principle.
> Learn SOLID to review AI output effectively."

The Four Pillars

1. ENCAPSULATION - Hide internal details
   private fields + public methods

2. INHERITANCE - Share common behavior
   extends for IS-A relationships

3. POLYMORPHISM - Same interface, different behavior
   Override methods in subclasses

4. ABSTRACTION - Focus on WHAT, not HOW
   Interfaces and abstract classes

SOLID Principles

S - Single Responsibility
  // BAD - Too many responsibilities
  class UserService {
    void createUser() { }
    void sendEmail() { }
    void generateReport() { }
    void validatePayment() { }
  }

  // GOOD - One responsibility each
  class UserService { void createUser() { } }
  class EmailService { void sendEmail() { } }
  class ReportService { void generateReport() { } }

O - Open/Closed (Open for extension, closed for modification)
  // BAD - Must modify for each new type
  class AreaCalculator {
    double calculate(Object shape) {
      if (shape instanceof Circle) { ... }
      else if (shape instanceof Square) { ... }
      // Must add new else-if for each shape!
    }
  }

  // GOOD - Extend without modifying
  interface Shape { double area(); }
  class Circle implements Shape { double area() { return PI * r * r; } }
  class Square implements Shape { double area() { return side * side; } }

L - Liskov Substitution
  // If Bird is the parent, all children must work as birds
  class Bird { void fly() { } }
  class Penguin extends Bird { void fly() { throw new Exception(); } } // VIOLATION!

  // GOOD - Separate flying and non-flying birds
  interface Bird { }
  interface FlyingBird extends Bird { void fly(); }

I - Interface Segregation
  // BAD - Fat interface
  interface Worker {
    void work();
    void eat();
    void sleep();
  }

  // GOOD - Segregated interfaces
  interface Workable { void work(); }
  interface Eatable { void eat(); }

D - Dependency Inversion
  // BAD - Depends on concrete class
  class OrderService {
    private MySQLDatabase db = new MySQLDatabase();
  }

  // GOOD - Depends on abstraction
  class OrderService {
    private final Database db;
    public OrderService(Database db) { this.db = db; }
  }

================================================================================

CHAPTER 6: ERROR HANDLING
================================================================================

> "AI generates catch blocks that swallow exceptions silently. This makes
> debugging impossible and hides real problems."

Checked vs Unchecked Exceptions

Checked (must handle or declare):
  - IOException, SQLException
  - Recoverable situations
  - Forces caller to handle

Unchecked (RuntimeException):
  - NullPointerException, IllegalArgumentException
  - Programming errors
  - Don't catch these, fix the code

AI Exception Mistakes

MISTAKE 1: Swallowing exceptions
  // TERRIBLE - AI does this constantly
  try {
    processPayment();
  } catch (Exception e) {
    // Silent failure!
  }

  // GOOD - At minimum, log it
  try {
    processPayment();
  } catch (PaymentException e) {
    logger.error("Payment failed for order {}: {}", orderId, e.getMessage());
    throw new OrderProcessingException("Payment failed", e);
  }

MISTAKE 2: Catching too broad
  // BAD - Catches everything including bugs
  try {
    doSomething();
  } catch (Exception e) { }

  // GOOD - Catch specific exceptions
  try {
    doSomething();
  } catch (IOException e) {
    // Handle IO issues
  } catch (ParseException e) {
    // Handle parsing issues
  }

MISTAKE 3: Not using try-with-resources
  // BAD - Resource leak
  FileInputStream fis = new FileInputStream("file.txt");
  try {
    // use fis
  } finally {
    fis.close(); // What if this throws?
  }

  // GOOD - Automatic resource management
  try (FileInputStream fis = new FileInputStream("file.txt")) {
    // use fis
  } // Automatically closed

Custom Exceptions

  public class InsufficientFundsException extends RuntimeException {
    private final BigDecimal balance;
    private final BigDecimal requested;

    public InsufficientFundsException(BigDecimal balance, BigDecimal requested) {
      super(String.format("Insufficient funds: balance=%s, requested=%s",
          balance, requested));
      this.balance = balance;
      this.requested = requested;
    }

    public BigDecimal getBalance() { return balance; }
    public BigDecimal getRequested() { return requested; }
  }

================================================================================

CHAPTER 7: COLLECTIONS FRAMEWORK
================================================================================

> "AI picks ArrayList for everything. Different collections have different
> performance characteristics that matter."

Collection Types

List (ordered, allows duplicates):
  - ArrayList: Fast random access, slow insert/delete in middle
  - LinkedList: Fast insert/delete, slow random access

Set (no duplicates):
  - HashSet: Fastest, no order guaranteed
  - LinkedHashSet: Maintains insertion order
  - TreeSet: Sorted order, slower

Map (key-value pairs):
  - HashMap: Fastest, no order
  - LinkedHashMap: Maintains insertion order
  - TreeMap: Sorted by keys
  - ConcurrentHashMap: Thread-safe

Queue:
  - ArrayDeque: Fast double-ended queue
  - PriorityQueue: Ordered by priority

When to Use What

  // Need fast lookup by key? -> HashMap
  Map<String, User> userCache = new HashMap<>();

  // Need to maintain insertion order? -> LinkedHashMap
  Map<String, User> recentUsers = new LinkedHashMap<>();

  // Need sorted keys? -> TreeMap
  Map<LocalDate, List<Order>> ordersByDate = new TreeMap<>();

  // Need unique items? -> HashSet
  Set<String> uniqueEmails = new HashSet<>();

  // Need thread-safe map? -> ConcurrentHashMap
  Map<String, Session> sessions = new ConcurrentHashMap<>();

AI Collection Mistakes

MISTAKE 1: Wrong collection type
  // BAD - O(n) contains check
  List<String> processedIds = new ArrayList<>();
  if (processedIds.contains(id)) { } // Slow for large lists!

  // GOOD - O(1) contains check
  Set<String> processedIds = new HashSet<>();
  if (processedIds.contains(id)) { } // Fast!

MISTAKE 2: Not sizing collections
  // BAD - Multiple resizes as it grows
  List<User> users = new ArrayList<>();
  for (int i = 0; i < 10000; i++) {
    users.add(new User());
  }

  // GOOD - Pre-size if you know the capacity
  List<User> users = new ArrayList<>(10000);

MISTAKE 3: Modifying during iteration
  // BAD - ConcurrentModificationException
  for (User user : users) {
    if (user.isInactive()) {
      users.remove(user); // Boom!
    }
  }

  // GOOD - Use iterator or removeIf
  users.removeIf(User::isInactive);

================================================================================

CHAPTER 8: MODERN JAVA FEATURES
================================================================================

> "AI often generates Java 8 code when Java 21 features are better.
> Know what's available in modern Java."

Records (Java 16+)

  // OLD - 50 lines of boilerplate
  public class User {
    private final String id;
    private final String name;
    // constructor, getters, equals, hashCode, toString...
  }

  // NEW - 1 line
  public record User(String id, String name) { }

  // Records are:
  // - Immutable
  // - Have automatic constructor, getters, equals, hashCode, toString

Sealed Classes (Java 17+)

  // Restrict what can extend a class
  public sealed class Shape permits Circle, Square, Triangle { }

  public final class Circle extends Shape { }
  public final class Square extends Shape { }
  public final class Triangle extends Shape { }

  // Now pattern matching knows all cases:
  String describe(Shape shape) {
    return switch (shape) {
      case Circle c -> "Circle with radius " + c.radius();
      case Square s -> "Square with side " + s.side();
      case Triangle t -> "Triangle";
      // No default needed - compiler knows all cases!
    };
  }

Pattern Matching (Java 21+)

  // OLD
  if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.length());
  }

  // NEW - Pattern matching for instanceof
  if (obj instanceof String s) {
    System.out.println(s.length());
  }

  // Switch expressions
  String result = switch (day) {
    case MONDAY, FRIDAY -> "Work hard";
    case SATURDAY, SUNDAY -> "Rest";
    default -> "Normal day";
  };

Optional

  // Avoid null returns
  public Optional<User> findUser(String id) {
    User user = userMap.get(id);
    return Optional.ofNullable(user);
  }

  // Usage
  findUser("123")
      .map(User::getEmail)
      .ifPresentOrElse(
          email -> sendEmail(email),
          () -> logger.warn("User not found")
      );

  // AI often does this wrong:
  Optional<User> user = findUser("123");
  if (user.isPresent()) {
    return user.get(); // Defeats the purpose!
  }

  // Better:
  return findUser("123").orElseThrow(() -> new UserNotFoundException(id));

================================================================================

CHAPTER 9: PROMPTING AI FOR JAVA
================================================================================

> "The quality of AI-generated Java depends entirely on how you describe
> your requirements and constraints."

The Context-First Prompt

BAD prompt:
  "Create a user service"

GOOD prompt:
  "Create a Java 21 UserService class.

  Requirements:
  - Use Spring Boot 3.2 with constructor injection
  - UserRepository is injected (JPA repository)
  - Methods: createUser, findById, updateEmail, deactivate
  - Use Optional for findById return
  - Throw UserNotFoundException (custom runtime exception) when not found
  - Use @Transactional for write operations
  - Log all operations with SLF4J
  - All fields validated with Jakarta validation"

Include Existing Code Context

  "I have these existing classes:

  public record User(UUID id, String email, boolean active) { }

  public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
  }

  Generate a UserService that uses these classes, following our pattern
  of returning Optional for queries and throwing exceptions for mutations."

Specify Error Handling

  "Error handling requirements:
  - Never swallow exceptions
  - Use custom exceptions: UserNotFoundException, DuplicateEmailException
  - Log at ERROR level with exception details
  - Include correlation ID in all log messages"

Specify Performance Requirements

  "Performance requirements:
  - Use @Cacheable for findById (cache name: 'users')
  - Batch operations for bulk updates
  - Use pagination for list operations (default page size 20)"

================================================================================

CHAPTER 10: REVIEWING AI JAVA OUTPUT
================================================================================

> "Trust but verify. Every AI-generated Java needs human review."

The Java Review Checklist

□ Types & Nullability
  - Primitives vs Objects correct?
  - Optional used for nullable returns?
  - @NonNull annotations where needed?
  - Null checks in constructors?

□ Collections
  - Right collection type for use case?
  - Pre-sized if size is known?
  - Immutable where appropriate?
  - Thread-safe if concurrent access?

□ Exception Handling
  - Specific exceptions caught?
  - Exceptions logged with context?
  - Resources closed properly (try-with-resources)?
  - Custom exceptions used appropriately?

□ OOP Principles
  - Single responsibility followed?
  - Dependencies injected, not created?
  - Interfaces used for abstraction?
  - Encapsulation maintained?

□ Thread Safety
  - Shared mutable state avoided?
  - ConcurrentHashMap for concurrent access?
  - Proper synchronization if needed?

□ Modern Java
  - Records for immutable data?
  - Stream operations idiomatic?
  - Optional used correctly?
  - Pattern matching where applicable?

Red Flags in AI Java Code

1. catch (Exception e) { } - Silent exception swallowing
2. public fields - Breaks encapsulation
3. new ArrayList<>() for everything - Wrong collection choice
4. synchronized on methods - Usually too coarse
5. .get() on Optional without check - Defeats the purpose
6. String concatenation in loops - Use StringBuilder
7. == for object comparison - Use .equals()
8. Raw types (List instead of List<User>) - Type safety lost

Example Review

AI generates:
  public class UserService {
    public UserRepository repo = new UserRepository();

    public User getUser(String id) {
      try {
        return repo.findById(id).get();
      } catch (Exception e) {
        return null;
      }
    }
  }

Problems:
- Public field
- Creates dependency instead of injection
- .get() without check
- Catches all exceptions
- Returns null instead of Optional or throwing

Fixed:
  @Service
  public class UserService {
    private final UserRepository repo;

    public UserService(UserRepository repo) {
      this.repo = repo;
    }

    public User getUser(String id) {
      return repo.findById(id)
          .orElseThrow(() -> new UserNotFoundException(id));
    }
  }

================================================================================

CHAPTER 11: THE QUAD FRAMEWORK — Organizing Teams Around AI
================================================================================

> "You can generate code with AI. But who decides WHAT to build? Who REVIEWS
> the output? Who DELIVERS it? That's where most teams fail."

The Missing Piece

Chapters 1-10 taught you how to think about Java, prompt AI effectively, and
review its output. But here's what we didn't cover:

How do teams actually work with AI at scale?

You're not a lone developer anymore. You're part of a team where:
- Product managers define requirements
- Tech leads make architectural decisions
- Developers implement features
- QA validates output
- DevOps deploys to production

The QUAD Framework

QUAD stands for the four stages every work item passes through:

  Q -> U -> A -> D
  Question -> Understand -> Allocate -> Deliver

| Stage | What Happens                    | Key Question                    |
|-------|---------------------------------|---------------------------------|
| Q     | Receive and clarify requirements| "What are we building and why?" |
| U     | Analyze and design solutions    | "How should we build it?"       |
| A     | Assign work to teams/circles    | "Who will build it?"            |
| D     | Implement and deliver           | "Is it done correctly?"         |

The AI Adoption Matrix

Not everyone should use AI the same way. QUAD includes an Adoption Matrix:

                    SKILL LEVEL
                Low      Medium     High
           +---------+---------+---------+
      High |Supervised|Collab   |Delegated|
           |Autonomy  |AI       |AI       |
TRUST -----+---------+---------+---------+
LEVEL Med  |Cautious |Balanced |Enhanced |
           |AI       |AI       |AI       |
      -----+---------+---------+---------+
      Low  |Restricted|Assisted |Expert   |
           |AI       |AI       |Review   |
           +---------+---------+---------+

The 4 Circles

QUAD organizes teams into 4 functional circles:

1. Management Circle - Product owners, scrum masters (Q and A stages)
2. Development Circle - Engineers, architects (U and D stages)
3. QA Circle - Testers, quality engineers (D stage support)
4. Infrastructure Circle - DevOps, SRE (D stage support)

================================================================================

CHAPTER 12: PRACTICAL QUAD WORKFLOWS
================================================================================

> "Setup isn't just installing tools. It's building a system where you can
> code with AI, review effectively, and ship confidently."

Workflow 1: Brand New Laptop Setup

Step 1: Essential Tools (30 min)
  # Install Homebrew
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  # Install Java 21 (LTS)
  brew install openjdk@21

  # Set JAVA_HOME
  echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 21)' >> ~/.zshrc
  source ~/.zshrc

Step 2: IDE + AI
  brew install --cask intellij-idea

  AI Plugins to install:
  - GitHub Copilot - AI code completion
  - JetBrains AI Assistant - Built-in AI

  Claude Code CLI:
  npm install -g @anthropic-ai/claude-code

Workflow 2: First Day on a New Team

1. Get Access:
   [] GitHub/GitLab repository access
   [] Slack/Teams channel access
   [] Jira/Linear board access
   [] VPN/internal network access

2. Clone and Run:
   git clone git@github.com:company/main-app.git
   cd main-app
   ./mvnw install
   ./mvnw spring-boot:run

3. Understand QUAD Setup:
   - What's my Adoption Matrix level?
   - What's my role-stage participation?
   - Which Circle am I in?

Workflow 3: Your First Feature (End-to-End QUAD)

Q Stage (Question):
  - Clarify requirements with PM
  - Understand acceptance criteria
  - Identify dependencies

U Stage (Understand):
  - Design solution with AI
  - Review AI output using Chapter 10 checklist
  - Document architecture decisions

A Stage (Allocate):
  - Break into tasks
  - Estimate effort
  - Assign to developers

D Stage (Deliver):
  - Implement with AI assistance
  - Review generated code
  - Test and deploy

Workflow 4: Code Review with AI

1. AI generates initial code
2. Run through Chapter 10 checklist
3. Look for:
   - Type safety issues
   - Exception handling gaps
   - Collection misuse
   - Thread safety problems
4. Request fixes or fix manually
5. Run tests before committing

================================================================================

KEY TAKEAWAYS
================================================================================

After reading this book, you can:

1. ✅ Understand Java types deeply enough to catch AI mistakes
2. ✅ Know when AI should use streams vs loops
3. ✅ Design proper OOP hierarchies
4. ✅ Apply SOLID principles to AI-generated code
5. ✅ Spot and fix exception handling problems
6. ✅ Choose the right collection for every use case
7. ✅ Leverage modern Java features (records, pattern matching, etc.)
8. ✅ Prompt AI effectively for Java code
9. ✅ Review AI code using the comprehensive checklist
10. ✅ Understand your role in a QUAD-organized team
11. ✅ Set up a complete Java AI development environment
12. ✅ Execute features end-to-end through Q-U-A-D stages

================================================================================

For the complete book with all 12 chapters, code examples, and detailed
workflows, visit: https://quadframe.work/book

QUAD Framework: https://quadframe.work
Source Code: https://github.com/sumanaddanki/books

================================================================================
                    (C) 2024-2025 A2Vibe Creators
                    Java for the AI Era - Version 3.0
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
    console.log(`Book download by: ${session.user.email} at ${new Date().toISOString()}`);

    // Create text file response (for MVP - can be upgraded to PDF later)
    const encoder = new TextEncoder();
    const bookBuffer = encoder.encode(bookContent);

    // Return as downloadable text file
    return new NextResponse(bookBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="Java-for-the-AI-Era-QUAD.txt"',
        'Content-Length': bookBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Book download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}

// GET for info
export async function GET(req: NextRequest) {
  return NextResponse.json({
    title: 'Java for the AI Era',
    version: '3.0',
    chapters: 12,
    format: 'txt',
    requiresAuth: true,
    includes: [
      'Java types and generics',
      'Control flow and streams',
      'OOP foundations and SOLID',
      'Exception handling patterns',
      'Collections framework',
      'Modern Java features',
      'AI prompting techniques',
      'Code review checklists',
      'QUAD Framework',
      'Practical workflows',
    ],
  });
}

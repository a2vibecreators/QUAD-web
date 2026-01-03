import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// Next.js book content
const bookContent = `
================================================================================
                      NEXT.JS FOR THE AI ERA
                            Version 1.0

                  Includes QUAD Framework Chapters

                        A2Vibe Creators
================================================================================

Table of Contents

Part I: Next.js Fundamentals (Chapters 1-8)
  Chapter 1: The AI UI Paradox
  Chapter 2: React Foundations
  Chapter 3: Next.js App Router
  Chapter 4: Server vs Client Components
  Chapter 5: Data Fetching Patterns
  Chapter 6: State Management
  Chapter 7: Styling & UI Patterns
  Chapter 8: Forms & Validation

Part II: Working with AI (Chapters 9-10)
  Chapter 9: Prompting AI for React/Next.js
  Chapter 10: Reviewing AI-Generated Components

Part III: QUAD Framework (Chapters 11-12)
  Chapter 11: The QUAD Framework
  Chapter 12: Practical QUAD Workflows for Frontend

================================================================================

CHAPTER 1: THE AI UI PARADOX
================================================================================

> "AI can generate any component in seconds. But it can't understand YOUR
> design system, YOUR state management, or YOUR user experience goals."

The Paradox

AI can generate React components instantly. Yet that same AI:
- Creates prop drilling nightmares
- Ignores your existing component library
- Mixes server and client code incorrectly
- Generates accessibility violations
- Picks wrong state management patterns

The paradox: The faster AI generates UI, the more you need to understand React.

Real Disasters

DISASTER #1: The Performance Collapse
A startup used AI to generate a product listing page. The AI created:

  export default function ProductList({ products }) {
    const [sortedProducts, setSortedProducts] = useState([]);

    useEffect(() => {
      setSortedProducts([...products].sort((a, b) => a.price - b.price));
    }, [products]);

    return sortedProducts.map(p => <ProductCard key={p.id} product={p} />);
  }

Looks fine? With 10,000 products:
- Re-sorts on every render
- useEffect causes double render
- No virtualization = DOM explosion
- Page became unusable

DISASTER #2: The State Corruption
AI generated a form that looked correct:

  export default function CheckoutForm() {
    const [cart, setCart] = useState(initialCart);

    const updateQuantity = (id, qty) => {
      cart.items.find(i => i.id === id).quantity = qty; // MUTATION!
      setCart(cart); // Same reference, no re-render
    };
  }

Result: UI didn't update. Users placed orders with wrong quantities.

The Core Truth

AI is a powerful amplifier for UI development:
- Know React deeply -> AI makes you 10x faster
- Don't know React -> AI creates 10x more bugs

================================================================================

CHAPTER 2: REACT FOUNDATIONS
================================================================================

> "Components are functions. Props are arguments. State is memory. If you
> don't understand these three things, AI will destroy your codebase."

The Mental Model

React is about:
1. Components = Functions that return UI
2. Props = Data passed from parent
3. State = Data that changes over time
4. Effects = Side effects after render

Components: Functions, Not Classes

AI often generates class components (outdated):

  // OLD - Don't accept this from AI
  class UserCard extends React.Component {
    render() {
      return <div>{this.props.name}</div>;
    }
  }

Modern approach:

  // GOOD - Functional component
  function UserCard({ name, email }: { name: string; email: string }) {
    return (
      <div className="user-card">
        <h3>{name}</h3>
        <p>{email}</p>
      </div>
    );
  }

Props: Data Flows Down

  // Parent passes data
  <UserCard name="John" email="john@example.com" />

  // Child receives it
  function UserCard({ name, email }) { ... }

Never modify props:
  // WRONG - AI sometimes does this
  function UserCard({ user }) {
    user.name = "Modified"; // NEVER mutate props
  }

State: The useState Hook

  function Counter() {
    const [count, setCount] = useState(0);

    return (
      <button onClick={() => setCount(count + 1)}>
        Clicked {count} times
      </button>
    );
  }

State rules AI often breaks:
1. Never mutate state directly
2. State updates may be batched
3. State updates based on previous state need callback form

  // WRONG - AI does this
  setCount(count + 1);
  setCount(count + 1); // Still adds 1, not 2!

  // CORRECT
  setCount(prev => prev + 1);
  setCount(prev => prev + 1); // Now adds 2

================================================================================

CHAPTER 3: NEXT.JS APP ROUTER
================================================================================

> "App Router isn't just file-based routing. It's a complete paradigm shift
> that AI frequently gets wrong."

The App Router Structure

  app/
  ├── layout.tsx        # Root layout (wraps all pages)
  ├── page.tsx          # Home page (/)
  ├── about/
  │   └── page.tsx      # About page (/about)
  ├── products/
  │   ├── page.tsx      # Products list (/products)
  │   └── [id]/
  │       └── page.tsx  # Product detail (/products/123)
  └── api/
      └── users/
          └── route.ts  # API route (/api/users)

Special Files

| File | Purpose |
|------|---------|
| page.tsx | The UI for a route |
| layout.tsx | Shared UI wrapper |
| loading.tsx | Loading UI (Suspense) |
| error.tsx | Error UI boundary |
| not-found.tsx | 404 UI |
| route.ts | API endpoint |

Layouts: Shared UI

  // app/layout.tsx
  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <html lang="en">
        <body>
          <nav>...</nav>
          <main>{children}</main>
          <footer>...</footer>
        </body>
      </html>
    );
  }

Layouts don't re-render when navigating between child pages.

Dynamic Routes

  // app/products/[id]/page.tsx
  export default async function ProductPage({
    params,
  }: {
    params: Promise<{ id: string }>;
  }) {
    const { id } = await params;
    const product = await getProduct(id);

    return <ProductDetail product={product} />;
  }

AI Mistakes with App Router:

1. Using 'use client' everywhere (defeats SSR benefits)
2. Forgetting params is now a Promise in Next.js 15+
3. Mixing Pages Router patterns (getServerSideProps)
4. Not using loading.tsx for Suspense

================================================================================

CHAPTER 4: SERVER VS CLIENT COMPONENTS
================================================================================

> "This is where AI fails the most. Server Components are the default.
> Client Components are the exception."

The Default: Server Components

In App Router, all components are Server Components unless marked otherwise.

Server Components can:
- Fetch data directly (no useEffect)
- Access backend resources
- Keep secrets on server
- Reduce client JavaScript

  // Server Component (default)
  async function ProductList() {
    const products = await db.products.findMany(); // Direct DB access!

    return (
      <ul>
        {products.map(p => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    );
  }

Client Components: When Needed

Add 'use client' directive ONLY when you need:
- useState, useEffect, other hooks
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party libraries that use hooks

  'use client';

  import { useState } from 'react';

  function SearchFilter() {
    const [query, setQuery] = useState('');

    return (
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
    );
  }

The Component Boundary Pattern

  // Server Component (fetches data)
  async function ProductPage() {
    const products = await getProducts();

    return (
      <div>
        <SearchFilter /> {/* Client Component for interactivity */}
        <ProductGrid products={products} /> {/* Can be server */}
      </div>
    );
  }

AI Mistakes:

1. Adding 'use client' to components that don't need it
2. Trying to use hooks in Server Components
3. Passing functions as props from Server to Client
4. Not understanding the serialization boundary

================================================================================

CHAPTER 5: DATA FETCHING PATTERNS
================================================================================

> "AI still generates useEffect + fetch for everything. There are better ways."

Pattern 1: Server Component Fetch (Preferred)

  // Just fetch in the component
  async function UserProfile({ userId }: { userId: string }) {
    const user = await fetch(\`/api/users/\${userId}\`).then(r => r.json());

    return <div>{user.name}</div>;
  }

Benefits:
- No loading states to manage
- Data ready at render
- No client JavaScript for fetch

Pattern 2: Parallel Fetching

  async function Dashboard() {
    // Start all fetches in parallel
    const [users, products, orders] = await Promise.all([
      getUsers(),
      getProducts(),
      getOrders(),
    ]);

    return (
      <div>
        <UserStats users={users} />
        <ProductChart products={products} />
        <OrderTable orders={orders} />
      </div>
    );
  }

Pattern 3: Suspense with loading.tsx

  // app/products/loading.tsx
  export default function Loading() {
    return <ProductSkeleton />;
  }

  // app/products/page.tsx
  async function ProductsPage() {
    const products = await getProducts(); // Automatically shows loading.tsx
    return <ProductList products={products} />;
  }

Pattern 4: Server Actions for Mutations

  // actions.ts
  'use server';

  export async function createProduct(formData: FormData) {
    const name = formData.get('name');
    await db.products.create({ data: { name } });
    revalidatePath('/products');
  }

  // ProductForm.tsx
  'use client';

  import { createProduct } from './actions';

  export function ProductForm() {
    return (
      <form action={createProduct}>
        <input name="name" />
        <button type="submit">Create</button>
      </form>
    );
  }

What AI Gets Wrong:

1. Using useEffect + fetch in Server Components
2. Not using Promise.all for parallel fetches
3. Client-side fetching when server fetch works
4. Not understanding revalidation patterns

================================================================================

CHAPTER 6: STATE MANAGEMENT
================================================================================

> "AI overcomplicates state. Most apps need less state than you think."

The State Hierarchy

From simplest to most complex:

1. Local State (useState) - Component-specific
2. Lifted State - Shared between siblings
3. Context - App-wide, infrequent updates
4. External Store - Complex, frequent updates

Rule: Start with the simplest option that works.

Local State (useState)

  function Counter() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
  }

Use for: Form inputs, toggles, local UI state

Lifted State

  // Parent owns the state
  function ProductPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
      <div>
        <ProductList onSelect={setSelectedId} />
        <ProductDetail id={selectedId} />
      </div>
    );
  }

Use for: State shared between siblings

Context (Use Sparingly)

  // ThemeContext.tsx
  const ThemeContext = createContext<'light' | 'dark'>('light');

  export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    return (
      <ThemeContext.Provider value={theme}>
        {children}
      </ThemeContext.Provider>
    );
  }

  export function useTheme() {
    return useContext(ThemeContext);
  }

Use for: Theme, auth, locale - things that rarely change

When to Use External Store (Zustand, Redux)

- Complex state logic
- Frequent updates
- State used across many unrelated components
- Need for devtools, middleware

AI Mistakes:

1. Using Redux for everything (overkill for most apps)
2. Putting server data in client state (use server components)
3. Prop drilling instead of lifting state
4. Creating context for every shared value

================================================================================

CHAPTER 7: STYLING & UI PATTERNS
================================================================================

> "AI generates inline styles and random CSS. Real apps need systems."

Styling Options in Next.js

1. CSS Modules (Built-in, Recommended)
2. Tailwind CSS (Most Popular)
3. CSS-in-JS (styled-components, Emotion)
4. Global CSS

CSS Modules

  // Button.module.css
  .button {
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
  }

  .primary {
    background: blue;
    color: white;
  }

  // Button.tsx
  import styles from './Button.module.css';

  export function Button({ variant = 'primary', children }) {
    return (
      <button className={\`\${styles.button} \${styles[variant]}\`}>
        {children}
      </button>
    );
  }

Tailwind CSS

  // Install: npm install tailwindcss postcss autoprefixer

  export function Button({ children }) {
    return (
      <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        {children}
      </button>
    );
  }

Common UI Patterns

Pattern 1: Card Component
  function Card({ title, children }) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        {children}
      </div>
    );
  }

Pattern 2: Responsive Layout
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {items.map(item => <Card key={item.id} {...item} />)}
  </div>

Pattern 3: Conditional Classes
  import clsx from 'clsx';

  <button className={clsx(
    'px-4 py-2 rounded',
    isActive && 'bg-blue-500 text-white',
    !isActive && 'bg-gray-200 text-gray-700',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )}>

AI Mistakes:

1. Inline styles everywhere
2. Random class names without system
3. Not mobile-first responsive design
4. Ignoring accessibility (focus states, contrast)

================================================================================

CHAPTER 8: FORMS & VALIDATION
================================================================================

> "Forms are where most AI-generated code breaks. Validation, errors,
> submission states - AI skips all of it."

The Complete Form Pattern

  'use client';

  import { useActionState } from 'react';
  import { createProduct } from './actions';

  export function ProductForm() {
    const [state, formAction, isPending] = useActionState(createProduct, null);

    return (
      <form action={formAction}>
        <div>
          <label htmlFor="name">Product Name</label>
          <input
            id="name"
            name="name"
            required
            minLength={3}
            className={state?.errors?.name ? 'border-red-500' : ''}
          />
          {state?.errors?.name && (
            <p className="text-red-500 text-sm">{state.errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="price">Price</label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            required
            min={0}
          />
          {state?.errors?.price && (
            <p className="text-red-500 text-sm">{state.errors.price}</p>
          )}
        </div>

        <button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Product'}
        </button>

        {state?.success && (
          <p className="text-green-500">Product created successfully!</p>
        )}
      </form>
    );
  }

Server Action with Validation

  'use server';

  import { z } from 'zod';
  import { revalidatePath } from 'next/cache';

  const schema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    price: z.coerce.number().positive('Price must be positive'),
  });

  export async function createProduct(prevState: any, formData: FormData) {
    const parsed = schema.safeParse({
      name: formData.get('name'),
      price: formData.get('price'),
    });

    if (!parsed.success) {
      return {
        errors: parsed.error.flatten().fieldErrors,
        success: false,
      };
    }

    await db.products.create({ data: parsed.data });
    revalidatePath('/products');

    return { success: true };
  }

What AI Skips:

1. Proper label associations (htmlFor)
2. Loading states during submission
3. Error display per field
4. Validation on both client and server
5. Accessible error announcements
6. Form reset after success

================================================================================

CHAPTER 9: PROMPTING AI FOR REACT/NEXT.JS
================================================================================

> "The quality of AI-generated components depends entirely on how you
> describe your requirements and constraints."

The Component-First Prompt

BAD prompt:
  "Create a product card"

GOOD prompt:
  "Create a Next.js 15 Server Component for a product card.

  Requirements:
  - TypeScript with strict types
  - Tailwind CSS for styling
  - Props: { product: { id, name, price, imageUrl, category } }
  - Show image, name, price (formatted as currency), category badge
  - Link to /products/[id]
  - Responsive: full width on mobile, 1/3 on desktop
  - Accessible: proper alt text, focus states"

Include Design System

Tell AI about your existing patterns:
  "Follow our design system:
  - Use Card component from @/components/ui/Card
  - Colors: primary (blue-500), secondary (gray-700)
  - Spacing: use Tailwind's spacing scale
  - Typography: headings use font-semibold
  - All images use next/image with proper sizing"

Specify State Requirements

  "State requirements:
  - This is a CLIENT component (needs 'use client')
  - Use useState for local quantity state
  - Use useOptimistic for cart updates
  - Call addToCart server action on button click
  - Show loading state while adding"

Specify Error Handling

  "Error handling:
  - Wrap async operations in try/catch
  - Show error message in red below form
  - Log errors to console for debugging
  - Don't crash the whole page on error"

================================================================================

CHAPTER 10: REVIEWING AI-GENERATED COMPONENTS
================================================================================

> "Trust but verify. Every AI-generated component needs human review."

The Component Review Checklist

□ Architecture
  - Server vs Client: Is 'use client' necessary?
  - Data fetching: Could this be a Server Component?
  - State: Is state minimal and in right place?

□ TypeScript
  - All props typed?
  - No 'any' types?
  - Return type explicit or inferred correctly?

□ Performance
  - No unnecessary re-renders?
  - Large lists virtualized?
  - Images use next/image?
  - Heavy computations memoized?

□ Accessibility
  - Semantic HTML (button, not div onClick)?
  - Labels for form inputs?
  - Alt text for images?
  - Keyboard navigation works?
  - Focus visible?

□ Styling
  - Follows design system?
  - Responsive on all screens?
  - Dark mode considered?
  - No inline styles?

□ Error Handling
  - Errors caught and displayed?
  - Loading states shown?
  - Empty states handled?

Red Flags in AI React Code

1. 'use client' on everything - Defeats SSR
2. useEffect for data fetching - Use Server Components
3. Inline onClick handlers - Extract to functions
4. Index as key - Use unique IDs
5. State for derived data - Compute during render
6. Prop drilling 4+ levels - Consider context or composition
7. Giant components - Break into smaller pieces
8. No TypeScript types - Add them

Example Review

AI generates:
  'use client';
  export default function Users() {
    const [users, setUsers] = useState([]);
    useEffect(() => {
      fetch('/api/users').then(r => r.json()).then(setUsers);
    }, []);
    return users.map((u, i) => <div key={i}>{u.name}</div>);
  }

Problems:
- 'use client' not needed
- useEffect fetch instead of Server Component
- Index as key
- No types
- No loading/error states

Fixed:
  // Server Component (no 'use client')
  interface User { id: string; name: string; }

  export default async function Users() {
    const users: User[] = await fetch('/api/users').then(r => r.json());
    return (
      <ul>
        {users.map(u => <li key={u.id}>{u.name}</li>)}
      </ul>
    );
  }

================================================================================

CHAPTER 11: THE QUAD FRAMEWORK — Organizing Frontend Work
================================================================================

> "You can generate components with AI. But who designs the UX? Who maintains
> the design system? Who ensures accessibility? That's where QUAD comes in."

Frontend Work in QUAD

The four stages for UI development:

  Q -> U -> A -> D
  Question -> Understand -> Allocate -> Deliver

| Stage | Frontend Focus                  | Key Question                    |
|-------|---------------------------------|---------------------------------|
| Q     | UX requirements, user stories   | "What does the user need?"      |
| U     | Component design, data flow     | "How should we build it?"       |
| A     | Assign UI/UX, frontend tasks    | "Who implements what?"          |
| D     | Implementation, testing, a11y   | "Is it correct and usable?"     |

The Frontend Adoption Matrix

                    SKILL LEVEL
                Low      Medium     High
           +---------+---------+---------+
      High |Simple   |Complex  |Arch     |
           |Pages    |Features |Decisions|
TRUST -----+---------+---------+---------+
LEVEL Med  |Static   |Dynamic  |State    |
           |Content  |Content  |Mgmt     |
      -----+---------+---------+---------+
      Low  |HTML/CSS |React    |Full     |
           |Only     |Basics   |Stack    |
           +---------+---------+---------+

Frontend Circles

1. Management Circle - UX requirements, user research
2. Development Circle - Component implementation, state
3. QA Circle - Visual testing, a11y audits, E2E tests
4. Infrastructure Circle - Build, deploy, CDN, monitoring

================================================================================

CHAPTER 12: PRACTICAL QUAD WORKFLOWS FOR FRONTEND
================================================================================

> "Frontend work isn't just writing components. It's a structured process from
> requirements to deployed, accessible UI."

Workflow 1: New Feature UI

Q Stage (Question):
  - What user problem are we solving?
  - What are the acceptance criteria?
  - What edge cases exist?
  - What's the mobile experience?

U Stage (Understand):
  - Sketch component hierarchy
  - Identify Server vs Client components
  - Plan data flow and state
  - Check existing components to reuse

A Stage (Allocate):
  - Designer: Mockups, design tokens
  - Frontend: Component implementation
  - QA: Test cases, a11y checklist

D Stage (Deliver):
  - Build components
  - Add Storybook stories
  - Write tests (unit + E2E)
  - Verify accessibility
  - Deploy and monitor

Workflow 2: Component Creation

1. Define interface (props, types)
2. Build static version first
3. Add interactivity
4. Add loading/error states
5. Add accessibility
6. Document in Storybook
7. Write tests

Workflow 3: Frontend Review Checklist

Before any PR with UI changes:
  [ ] Component follows design system
  [ ] TypeScript types complete
  [ ] Server/Client split correct
  [ ] Responsive on all breakpoints
  [ ] Keyboard navigation works
  [ ] Screen reader tested
  [ ] Loading and error states exist
  [ ] No console errors/warnings
  [ ] Tests pass

================================================================================

KEY TAKEAWAYS
================================================================================

After reading this book, you can:

1. ✅ Understand React deeply enough to catch AI mistakes
2. ✅ Know when to use Server vs Client Components
3. ✅ Implement proper data fetching patterns
4. ✅ Manage state without overcomplicating
5. ✅ Build accessible, responsive UI
6. ✅ Create forms with proper validation
7. ✅ Review AI-generated components effectively
8. ✅ Understand your role in a QUAD-organized frontend team
9. ✅ Set up a complete Next.js development environment
10. ✅ Execute UI features end-to-end through Q-U-A-D stages

================================================================================

For the complete book with all 12 chapters, code examples, and detailed
workflows, visit: https://quadframe.work/book

QUAD Framework: https://quadframe.work
Source Code: https://github.com/sumanaddanki/books

================================================================================
                    (C) 2024-2025 A2Vibe Creators
                    Next.js for the AI Era - Version 1.0
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
    console.log(`Next.js book download by: ${session.user.email} at ${new Date().toISOString()}`);

    // Create text file response
    const encoder = new TextEncoder();
    const bookBuffer = encoder.encode(bookContent);

    // Return as downloadable text file
    return new NextResponse(bookBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="NextJS-for-the-AI-Era-QUAD.txt"',
        'Content-Length': bookBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Next.js book download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}

// GET for info
export async function GET(req: NextRequest) {
  return NextResponse.json({
    title: 'Next.js for the AI Era',
    version: '1.0',
    chapters: 12,
    format: 'txt',
    requiresAuth: true,
    includes: [
      'React fundamentals for AI era',
      'Next.js App Router patterns',
      'Server vs Client Components',
      'Data fetching and state management',
      'AI prompting for React/Next.js',
      'QUAD Framework for frontend work',
    ],
  });
}

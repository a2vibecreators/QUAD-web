# QUAD Framework - Web Application

Next.js web application for the QUAD Framework project management platform.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma ORM with PostgreSQL
- **Auth**: NextAuth.js

## Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database (uses quad-database container)
DATABASE_URL="postgresql://quad_user:quad_dev_pass@localhost:14201/quad_dev_db"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Java Backend
QUAD_API_URL="http://localhost:14101/api"
```

## Project Structure

```
quad-web/
├── src/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # React components
│   └── lib/          # Utilities and services
├── prisma/           # Database schema
└── public/           # Static assets
```

## Related Submodules

- [quad-services](../quad-services) - Java Spring Boot backend (port 14101)
- [quad-database](../quad-database) - PostgreSQL database schemas (port 14201)
- [quad-android](../quad-android) - Android application
- [quad-ios](../quad-ios) - iOS application
- [quad-vscode](../quad-vscode) - VS Code extension

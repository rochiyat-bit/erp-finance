# ERP Finance System - Phase 1 (Core Infrastructure)

A production-ready ERP Finance System built with Next.js 14, TypeScript, PostgreSQL, and NextAuth.js. This is Phase 1, which establishes the core infrastructure for a multi-tenant enterprise financial management system.

## Features

### Phase 1 - Core Infrastructure (Current)

- **Multi-tenant Architecture**: Isolated data per company with complete separation
- **Authentication & Authorization**: Secure authentication with NextAuth.js and JWT
- **Role-Based Access Control (RBAC)**: Flexible permission system with predefined and custom roles
- **User Management**: Complete user lifecycle management
- **Company Management**: Company profile and settings
- **Security**: Rate limiting, input validation, password hashing, and audit logging
- **Database**: PostgreSQL with Sequelize ORM
- **UI Components**: Modern UI with shadcn/ui and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14.2+ (App Router, React 18+)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 15+ with Sequelize ORM 6.37+
- **Authentication**: NextAuth.js v4 with JWT strategy
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 3.4+
- **Form Handling**: React Hook Form + Zod validation
- **Logging**: Winston for structured logging
- **Rate Limiting**: @upstash/ratelimit with Redis
- **Notifications**: Sonner for toast notifications

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis (optional, for rate limiting)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd erp-finance
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.local` and update with your values:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/erp_finance
DB_SSL=false

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-minimum-32-characters-long

# JWT
JWT_SECRET=your-jwt-secret-here-minimum-32-characters-long
JWT_EXPIRY=7d
```

### 4. Create PostgreSQL database

```bash
createdb erp_finance
```

### 5. Run database migrations

The application will automatically sync database models on first run in development mode.

### 6. Start development server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
erp-finance/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Dashboard pages
│   │   └── dashboard/
│   ├── api/                 # API routes
│   │   └── auth/
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   └── providers.tsx        # App providers
├── lib/                     # Library code
│   ├── db/                  # Database models
│   │   ├── models/          # Sequelize models
│   │   └── sequelize.ts     # DB connection
│   ├── validators/          # Zod schemas
│   ├── auth.ts              # NextAuth config
│   ├── permissions.ts       # Permission system
│   ├── logger.ts            # Winston logger
│   ├── error-handler.ts     # Error handling
│   └── rate-limit.ts        # Rate limiting
├── types/                   # TypeScript types
│   ├── models.ts            # Model interfaces
│   └── api.ts               # API types
└── middleware.ts            # Route protection
```

## Database Models

Phase 1 includes the following models:

- **Company**: Multi-tenant company data
- **User**: User accounts with RBAC
- **Role**: Custom and system roles
- **Permission**: Permission definitions
- **AuditLog**: Audit trail for all actions
- **SystemSetting**: Company-specific settings
- **Currency**: Multi-currency support
- **ExchangeRate**: Currency exchange rates
- **FiscalYear**: Fiscal year management
- **FiscalPeriod**: Fiscal period tracking

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new company
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints (login, logout, etc.)

### Future Endpoints (Coming in next phases)

- User management
- Company settings
- Role & permission management
- Currency management
- Fiscal year management
- Audit logs

## User Roles

Predefined system roles:

- **super_admin**: Full system access
- **admin**: Company administration
- **manager**: Management access
- **accountant**: Accounting operations
- **staff**: Basic access
- **viewer**: Read-only access

## Security Features

- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, number, and special character
- **Account Locking**: 5 failed attempts lock account for 30 minutes
- **Rate Limiting**: Configurable limits per endpoint
- **Input Validation**: All inputs validated with Zod
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Protection**: React auto-escaping + CSP headers
- **Security Headers**: Comprehensive security headers configured

## Development

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm start
```

### Linting

```bash
npm run lint
```

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Environment Variables (Production)

Make sure to set all environment variables in your production environment:

- `DATABASE_URL`: PostgreSQL connection string (with SSL enabled)
- `NEXTAUTH_URL`: Your production URL
- `NEXTAUTH_SECRET`: Strong random secret
- `JWT_SECRET`: Strong random secret
- `UPSTASH_REDIS_REST_URL`: Upstash Redis URL (optional)
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis token (optional)

## Future Phases

- **Phase 2**: General Ledger Module
- **Phase 3**: Accounts Payable
- **Phase 4**: Accounts Receivable
- **Phase 5**: Reporting & Analytics

## License

See LICENSE file for details.

## Support

For issues and questions, please create an issue in the repository.

# Knowledge Agents

A web application that integrates Google Drive documents with Gemini File Search Store, providing a knowledge base as MCP servers and Agent skills.

## Project Structure

### Monorepo Structure

- **Application**: Next.js (App Router) + Firebase + Mantine UI
- **Cloud Functions**: Firebase Functions (TypeScript)
- **Shared Packages**: Type definitions/models, Firebase Admin SDK, test utilities

### Main Technology Stack

- **Frontend**: Next.js, React, TypeScript, Mantine UI, Tailwind CSS
- **Backend**: Firebase Functions, Firebase Admin SDK
- **Database**: Firestore
- **Authentication**: Firebase Authentication (Google)
- **External Integrations**: Google Drive API, Gemini API (File Search Store)
- **Deployment**: Cloud Run (SSR), Firebase Hosting
- **Testing**: Vitest, Playwright, Firebase Emulator Suite
- **Monorepo Management**: pnpm workspace

## Development Environment Setup

### Prerequisites

- Node.js (see [.node-version](.node-version) for version)
- pnpm (see `packageManager` field in [package.json](package.json) for version)
- Firebase CLI
- gcloud CLI

### Initial Setup

```bash
# Install packages
npm install -g pnpm firebase-tools
pnpm install

# Firebase authentication
firebase login

# Build shared packages
pnpm build:shared

# Start development server (default environment)
pnpm dev
```

### Environment Configuration Files

The following configuration files are required for each environment:

- `.env.default` (deployment environment)
- `.env.dev` (development environment/emulator)
- `.env.test` (test environment)
- `scripts/.env.default`

## Important Commands

### Development

```bash
# Start development server (use this for emulator environment/testing)
pnpm dev:dev

# Start development server (default environment)
pnpm dev

# Build shared packages
pnpm build:shared

# Start Firebase Emulator
pnpm emulators:start:dev
```

### Testing

```bash
# Run all tests
pnpm test:all

# App tests
pnpm test:app

# E2E tests
pnpm test:e2e

# E2E tests (specify file, wrap file path in single quotes)
pnpm test:e2e 'tests/e2e/xxx.spec.ts'

# Cloud Functions tests
pnpm test:functions

# Cloud Functions tests (specify file, use relative path from services/functions directory, wrap in single quotes)
pnpm test:functions 'src/auth/_tests/beforeUserCreated.test.ts'

# Firestore rules tests
pnpm test:rules:firestore
```

### Build and Deploy

```bash
# Full deployment (Functions + Web)
pnpm deploy:default

# Web deployment (Firestore, Cloud Run, Hosting)
pnpm deploy:default:web

# Cloud Run only deployment
pnpm deploy:default:cloudrun

# Firebase Hosting only deployment
pnpm deploy:default:hosting

# Cloud Functions only deployment
pnpm deploy:default:functions
```

### Code Quality

```bash
# Run lint
pnpm lint

# Fix lint issues
pnpm lint:fix

# Format code
pnpm format
```

## Directory Structure

```text
├── src/                   # Next.js application
│   ├── app/              # App Router (pages/layouts)
│   ├── components/       # React components
│   ├── contexts/         # React Context
│   ├── hooks/            # Custom hooks
│   ├── layouts/          # Layout components
│   ├── models/           # Data models
│   ├── server/           # Server-side code
│   ├── styles/           # Global styles
│   └── utils/            # Utility functions
├── services/functions/    # Cloud Functions
├── packages/             # Shared packages (shared, admin-shared, test-shared)
├── scripts/              # Operations scripts
└── tests/                # Test files
```

## Firebase Configuration

### Project Aliases

- `default`: Deployment environment
- `dev`: Local development (emulator)
- `test`: Testing (emulator)

### Services Used

Firebase Authentication, Firestore, Cloud Functions, Firebase Hosting

## Authentication and User Management

### User Roles

- Regular User: Access to basic features
- Admin: Access to admin panel (`/admin`)

### Authentication Method

Google

## Development Guidelines

### Firebase SDK Usage Rules

**Important**: Direct imports from `firebase/*` or `firebase-admin/*` are prohibited (enforced by [eslint.config.js](eslint.config.js))

- **Web**: Use wrappers from `~/utils/firebase/*`
- **Functions**: Use wrappers from `@local/admin-shared`
- **Tests**: Use wrappers from `@local/test-shared`

### Coding Standards

Refer to configuration files for details:

- **TypeScript**: [tsconfig.json](tsconfig.json) - strict mode, noUncheckedIndexedAccess enabled
- **ESLint**: [eslint.config.js](eslint.config.js) - import order, type import priority, etc.
- **Prettier**: [.prettierrc.cjs](.prettierrc.cjs) - max 120 characters, single quotes, semicolons required
- **Stylelint**: [.stylelintrc.cjs](.stylelintrc.cjs) - CSS Modules, recess-order

#### Key Rules

- **Type Imports**: Prefer `import type` (enforced by ESLint)
- **Import Order**: builtin → external → internal → parent → sibling (auto-sorted)
- **CSS**: Use CSS Modules, properties follow recess-order

### Path Aliases

- `~/*`: Maps to `./src/*`
- Example: `import { signIn } from '~/utils/firebase/auth'`

### Testing Strategy

- Unit Tests: Vitest
- E2E Tests: Playwright
- Uses Firebase Emulator Suite

### Required Development Rules

- Follow existing files as much as possible to maintain code consistency within the project (applies to test code as well)
- Add comments only when the intent is not clear from the code
- Always run `pnpm build:shared` when shared packages are modified
- Always run type check/lint/format after changes
  - `pnpm lint:fix`
  - `pnpm format`

## Deployment

### Environment Configuration

- Runs in SSR mode on Cloud Run (asia-northeast1)
- Dependent projects need to be rebuilt when shared packages change
- Firebase Emulator has data persistence configured

### Deployment Flow

1. Run `pnpm build:shared` if there are changes to shared packages
2. Run lint and format
3. Run `pnpm deploy:default`

## Common Patterns

### Fetching Firestore Data

```typescript
import { useDocumentData } from '~/hooks/firebase/useDocumentData';

const { data, loading, error } = useDocumentData(doc(db, 'users', userId));
```

### Getting Authentication State

```typescript
import { useAuth } from '~/contexts/auth';

const { currentUser, loading } = useAuth();
```

### Creating Forms

```typescript
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

const form = useForm({
  validate: zod4Resolver(schema),
  initialValues: { email: '' },
});
```

## Troubleshooting

### Common Issues and Solutions

1. **Shared package changes not reflected**: Run `pnpm build:shared`
2. **Cloud Functions deployment failure**: Often resolved by re-running
3. **Emulator data disappears**: Check data persistence settings

### Checking Logs

```bash
# Firebase Functions logs
firebase functions:log --project <project-id>

# Check gcloud project settings
gcloud config list
```

## Reference Links

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Mantine UI Documentation](https://mantine.dev/)
- [Google Drive API](https://developers.google.com/drive/api/guides/about-sdk)
- [Gemini API](https://ai.google.dev/gemini-api/docs)

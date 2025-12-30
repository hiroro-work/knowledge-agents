# Firebase Cloud Functions - Development Guide

## Overview

This directory manages the Firebase Cloud Functions code.
Written in TypeScript, it implements backend processing using the Firebase Admin SDK.

**Important**: Refer to the [root CLAUDE.md](../../CLAUDE.md) for project-wide conventions.

### Directory-Specific Configuration

- **ESLint**: [eslint.config.js](eslint.config.js)
- **Prettier**: [.prettierrc.cjs](.prettierrc.cjs)
- **TypeScript**: [tsconfig.json](tsconfig.json)
- **Node.js**: 22 (specified in [package.json](package.json))

## Directory Structure

```text
services/functions/
├── src/
│   ├── auth/           # Authentication-related functions
│   ├── firestore/      # Firestore triggers
│   ├── schedules/      # Scheduled functions
│   ├── taskQueues/     # Task queue functions
│   └── utils/          # Utilities
├── lib/                # Built JavaScript files
└── tests/              # Test code
```

## Important Rules

### 1. Using Firebase Admin SDK

- Do not import directly from `firebase-admin/*`
- Use via `@local/admin-shared` package
- Example: `import { db } from '@local/admin-shared'`

### 2. Environment Variables

- Set environment in `.env.default`
- Access via `src/utils/env.ts`

### 3. Function Definitions

```typescript
// onCall function (called from client)
export const myFunction = onCall(
  {
    region: 'asia-northeast1',
  },
  async (request) => {
    // Processing
  },
);

// onRequest function (HTTP)
export const myHttpFunction = onRequest({ region: 'asia-northeast1' }, async (req, res) => {
  // Processing
});
```

### 4. Authentication Hooks

```typescript
// src/auth/beforeUserCreated.ts
export const beforeUserCreated = beforeUserCreatedFunction(async (event) => {
  // Processing before user creation
});
```

## Development Commands

```bash
# Install packages
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
pnpm lint:fix

# Deploy
pnpm deploy
```

## Testing

```bash
# Run tests with emulator
pnpm emulators:exec:test

# Run specific test file (wrap file path in single quotes)
pnpm emulators:exec:test 'src/auth/_tests/beforeUserCreated.test.ts'
```

- Uses Vitest
- Integrates with Firebase emulator

## Pre-Deployment Notes

1. **Build**: Always run build before deployment
2. **Packages**: Deploy including local packages

## Common Patterns

### Accessing Firestore

```typescript
import { db } from '@local/admin-shared';

const userDoc = await db.collection('users').doc(userId).get();
```

### Checking User Permissions

```typescript
import { HttpsError } from '@local/admin-shared';

if (!request.auth) {
  throw new HttpsError('unauthenticated', 'Login required');
}
```

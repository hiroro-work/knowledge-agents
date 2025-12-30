# Shared Packages - Development Guide

## Overview

This directory manages packages shared across the project.
It uses a monorepo structure with pnpm workspaces.

**Important**: Refer to the [root CLAUDE.md](../CLAUDE.md) for project-wide conventions.

## Package List

### shared (`@local/shared`)

- **Purpose**: Common code for Web/Functions
- **Contents**: Shared type definitions, constants, utility functions

### admin-shared (`@local/admin-shared`)

- **Purpose**: Common code for Firebase Admin SDK
- **Contents**: Admin SDK wrappers, server-side utilities

### test-shared (`@local/test-shared`)

- **Purpose**: Common code for testing
- **Contents**: Test factories, mock data, test utilities

## Development Notes

### 1. When Modifying Packages

Always run the build after modifying packages:

```bash
pnpm build:shared
```

### 2. Adding New Functions/Types

Don't forget to export from each package's `index.ts`:

```typescript
// packages/shared/src/index.ts
export { myNewFunction } from './utils/myNewFunction';
export type { MyNewType } from './types/MyNewType';
```

### 3. Preparing Packages for Functions

Local packages need to be packed when deploying Cloud Functions:

```bash
pnpm firebase:functions:packages:add
```

## Commands

```bash
# Build each package
pnpm shared build
pnpm admin-shared build
pnpm test-shared build

# Build all packages
pnpm build:shared

# Lint and format
pnpm shared lint
pnpm admin-shared format
```

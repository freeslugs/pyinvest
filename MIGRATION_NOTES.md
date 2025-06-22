# Next.js Migration: Pages Router to App Router

This document outlines the migration from Next.js Pages Router to App Router structure.

## Changes Made

### 1. Directory Structure
- **Removed**: `pages/` directory
- **Added**: `app/` directory with new App Router structure

### 2. Page Migrations

#### Root Layout (`pages/_app.tsx` → `app/layout.tsx`)
- Converted the global app wrapper to the new `layout.tsx` format
- Moved metadata configuration from `Head` components to `metadata` export
- Font preloading moved to the layout head section

#### Home Page (`pages/index.tsx` → `app/page.tsx`)
- Converted `getServerSideProps` to server component logic
- Split client-side functionality into separate `login-client.tsx` component
- Used `cookies()` from `next/headers` for server-side cookie access
- Used `redirect()` from `next/navigation` for server-side redirects

#### Dashboard (`pages/dashboard.tsx` → `app/dashboard/page.tsx`)
- Converted to client component with `"use client"` directive
- Updated router import from `next/router` to `next/navigation`
- Created separate layout file for dashboard-specific metadata

### 3. API Routes Migration

#### API Structure Changes
- **From**: `pages/api/` structure
- **To**: `app/api/` with `route.ts` files

#### Updated Routes
- `pages/api/verify.ts` → `app/api/verify/route.ts`
- `pages/api/ethereum/personal_sign.ts` → `app/api/ethereum/personal_sign/route.ts`
- `pages/api/solana/sign_message.ts` → `app/api/solana/sign_message/route.ts`

#### API Handler Changes
- Converted from default export functions to named HTTP method exports (`GET`, `POST`)
- Updated from `NextApiRequest`/`NextApiResponse` to `NextRequest`/`NextResponse`
- Updated utility functions in `lib/utils.ts` to support both router types

### 4. Utility Functions
- Added `fetchAndVerifyAuthorizationAppRouter` function for App Router API compatibility
- Maintained backward compatibility with existing Pages Router utilities

### 5. Configuration Updates
- Updated `package.json` scripts to reference `app/` directory instead of `pages/`
- No changes needed to `next.config.js` (App Router works with existing config)

## Key Differences

### Server vs Client Components
- App Router uses Server Components by default
- Client components require explicit `"use client"` directive
- Hooks and interactive elements need client components

### Data Fetching
- `getServerSideProps` replaced with async server components
- `useRouter` updated to use `next/navigation` instead of `next/router`
- Cookie access uses `cookies()` from `next/headers` in server components

### Metadata
- Page-level metadata now uses `metadata` export instead of `Head` component
- Global metadata configured in root `layout.tsx`

## Benefits of App Router
1. **Better Performance**: Server Components reduce client-side JavaScript
2. **Improved SEO**: Better server-side rendering capabilities
3. **Streaming**: Support for React 18 streaming features
4. **Layout System**: More flexible nested layout system
5. **Type Safety**: Better TypeScript integration

## Notes
- All existing functionality should work the same
- API endpoints remain at the same URLs
- Component imports and styling remain unchanged
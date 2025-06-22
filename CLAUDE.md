# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (or `pnpm dev`)
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Lint and type check**: `npm run lint` (runs Next.js ESLint, Prettier check, and TypeScript compiler)
- **Format code**: `npm run format` (formats TypeScript/JavaScript files with Prettier)

## Architecture Overview

This is a Next.js 14+ application using the **App Router** architecture with Privy authentication integration.

### Key Architecture Patterns

- **App Router Structure**: Uses Next.js App Router (`app/` directory) instead of Pages Router
- **Authentication**: Privy Auth handles wallet-based authentication with embedded wallet creation
- **Styling**: Tailwind CSS with custom fonts (Adelle Sans) and Headless UI components
- **API Routes**: Authentication endpoints in `app/api/` for Ethereum/Solana message signing and verification

### Important Files

- `app/providers.tsx`: PrivyProvider configuration with embedded wallet settings
- `app/layout.tsx`: Root layout with metadata and font preloading
- `app/dashboard/`: Protected dashboard area requiring authentication
- `app/api/`: Authentication API routes for wallet verification
- `components/`: Reusable UI components including wallet cards and navigation

### Environment Setup

Requires `NEXT_PUBLIC_PRIVY_APP_ID` environment variable for Privy integration.

### Migration Notes

This project was migrated from Pages Router to App Router - see `MIGRATION_NOTES.md` for details on structural changes made during migration.

# Pyinvest

A modern investment app built with [NextJS](https://nextjs.org/) and powered by [**Privy Auth**](https://www.privy.io/) for secure wallet authentication.

This app uses NextJS's [App Router](https://nextjs.org/docs/app).

## Setup

1. Clone this repository and open it in your terminal.

```sh
git clone <your-repo-url>
```

2. Install the necessary dependencies (including [Privy Auth](https://www.npmjs.com/package/@privy-io/react-auth)) with `npm`.

```sh
npm i
```

3. Initialize your environment variables by copying the `.env.example` file to an `.env.local` file. Then, in `.env.local`, [paste your Privy App ID from the dashboard](https://docs.privy.io/guide/dashboard/api-keys).

```sh
# In your terminal, create .env.local from .env.example
cp .env.example .env.local

# Add your Privy App ID to .env.local
NEXT_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
```

## Building locally

In your project directory, run `npm run dev`. You can now visit http://localhost:3000 to see your app and login with Privy!

## Architecture

- `app/layout.tsx` - How to use the `PrivyProvider` and initialize it with your Privy App ID
- `app/page.tsx` - How to implement authentication and login functionality
- `app/dashboard/page.tsx` - How to use the `usePrivy` hook and implement wallet linking features

**Check out [Privy's docs](https://docs.privy.io/) for more guidance around using Privy in your app!**

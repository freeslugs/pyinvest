import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Privy Auth Cookbook',
  description: 'Cookbook examples for Privy Auth implementation',
};

export default function CookbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

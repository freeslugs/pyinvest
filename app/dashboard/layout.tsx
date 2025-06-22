import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Pyinvest Dashboard',
  description: 'Pyinvest Dashboard',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

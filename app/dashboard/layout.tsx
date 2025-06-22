import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privy Auth Demo",
  description: "Dashboard for Privy Auth Demo",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
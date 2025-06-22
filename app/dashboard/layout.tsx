import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pyinvest Dashboard",
  description: "Pyinvest Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
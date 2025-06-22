import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PyUSD Yield Dashboard",
  description: "Dashboard for PyUSD yield strategies and investment options",
};

export default function PyUSDLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
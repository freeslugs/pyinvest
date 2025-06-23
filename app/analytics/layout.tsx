import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics - PyInvest',
  description:
    'Yield projections and investment analytics for your crypto savings',
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

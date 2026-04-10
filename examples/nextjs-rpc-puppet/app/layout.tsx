import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Backend-Controlled Avatar',
  description: 'Runway avatar driven by a single backend RPC tool',
};

export default function RootLayout(props: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{props.children}</body>
    </html>
  );
}

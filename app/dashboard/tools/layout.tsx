// app/dashboard/tools/layout.tsx
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Tools | Buena Onda AI',
};

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Tools</h1>
        <p className="text-neutral-600">
          AI-powered strategy, marketing, ads, SEO, GHL workflows, finance, and custom flows.
        </p>
      </header>
      {children}
    </div>
  );
}

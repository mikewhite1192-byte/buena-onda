"use client";

import Button from "./ui/Button";
import Container from "./ui/Container";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-onda-bg" />

      <Container className="py-24 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-onda-slate">
  The <span className="text-onda-teal">AI Business Stack</span> for Modern Entrepreneurs
</h1>
          <p className="mt-6 text-lg md:text-xl text-onda-slate/80">
            Daily clarity and support across Business Strategy, HubSpot
            operations, Meta ads, Google/SEO, and Finance — all in one simple
            platform powered by AI.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button as="link" href="/start" size="lg">
              Start Free — Guided Setup
            </Button>
            <Button as="link" href="/products" variant="ghost" size="lg">
              Explore the Stack
            </Button>
          </div>

          <div className="mt-4 text-sm text-onda-slate/60">
            One subscription • Five essential tools • Built for creators and entrepreneurs
          </div>
        </div>
      </Container>
    </section>
  );
}

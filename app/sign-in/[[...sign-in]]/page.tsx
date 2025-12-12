"use client";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="mx-auto max-w-md py-12">
      <SignIn afterSignInUrl="/app" />
    </div>
  );
}

"use client";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="mx-auto max-w-md py-12">
      <SignUp afterSignUpUrl="/app" />
    </div>
  );
}

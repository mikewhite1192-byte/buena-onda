"use client";
import { SignUp } from "@clerk/nextjs";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

// Only allow same-origin paths so an open redirect can't be smuggled through.
function safeRedirect(target: string | null): string | null {
  if (!target) return null;
  if (!target.startsWith("/") || target.startsWith("//")) return null;
  return target;
}

function SignUpInner() {
  const params = useSearchParams();
  const redirectUrl = safeRedirect(params.get("redirect_url"));
  const [unsafeMetadata, setUnsafeMetadata] = useState<Record<string, string> | undefined>(undefined);

  useEffect(() => {
    const ref = getCookie("bo_ref");
    if (ref) setUnsafeMetadata({ bo_ref: ref });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <SignUp
        unsafeMetadata={unsafeMetadata}
        afterSignUpUrl={redirectUrl ?? "/#pricing"}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <SignUpInner />
    </Suspense>
  );
}

"use client";
import { SignUp } from "@clerk/nextjs";
import { useEffect, useState } from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function Page() {
  const [unsafeMetadata, setUnsafeMetadata] = useState<Record<string, string> | undefined>(undefined);

  useEffect(() => {
    const ref = getCookie("bo_ref");
    if (ref) setUnsafeMetadata({ bo_ref: ref });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <SignUp unsafeMetadata={unsafeMetadata} afterSignUpUrl="/#pricing" />
    </div>
  );
}

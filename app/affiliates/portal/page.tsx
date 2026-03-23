"use client";

// app/affiliates/portal/page.tsx — redirects to new dashboard
import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function Redirect() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email");

  useEffect(() => {
    const dest = email
      ? `/affiliates/dashboard?email=${encodeURIComponent(email)}`
      : "/affiliates/dashboard";
    router.replace(dest);
  }, [email, router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0f14", color: "#8b8fa8", fontFamily: "monospace", fontSize: 13 }}>
      Redirecting to dashboard…
    </div>
  );
}

export default function PortalRedirect() {
  return (
    <Suspense>
      <Redirect />
    </Suspense>
  );
}

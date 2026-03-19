// app/auth-debug/page.tsx
export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";

export default async function Page() {
  const { userId, sessionId } = await auth();
  return (
    <pre className="p-6 text-sm">
      {JSON.stringify({ from: "auth-debug", userId, sessionId }, null, 2)}
    </pre>
  );
}

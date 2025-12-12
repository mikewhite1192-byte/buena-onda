// app/server-check/page.tsx
import { auth } from "@clerk/nextjs/server";

export default function ServerCheck() {
  const { userId, sessionId } = auth(); // ✅ no await
  return (
    <pre className="p-6">{JSON.stringify({ userId, sessionId }, null, 2)}</pre>
  );
}

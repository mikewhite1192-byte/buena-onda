// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';

export default async function Page() {
  const { userId, sessionId } = await auth();

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <pre>
{`userId:    ${userId ?? 'null'}
sessionId: ${sessionId ?? 'null'}`}
      </pre>
    </main>
  );
}

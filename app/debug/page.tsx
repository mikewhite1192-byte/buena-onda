import { auth } from '@clerk/nextjs/server';

export default async function Debug() {
  const { userId, sessionId } = await auth();
  return (
    <pre className="p-6">
{JSON.stringify({ userId, sessionId }, null, 2)}
    </pre>
  );
}

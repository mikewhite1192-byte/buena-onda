import { auth } from '@clerk/nextjs/server';

export default function Debug() {
  const { userId, sessionId } = auth();
  return (
    <pre className="p-6">
{JSON.stringify({ userId, sessionId }, null, 2)}
    </pre>
  );
}

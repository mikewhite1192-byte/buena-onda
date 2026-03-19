import { auth } from "@clerk/nextjs/server";

export default async function Page() {
  const { userId, sessionId } = await auth();
  return <pre className="p-6">{JSON.stringify({ userId, sessionId }, null, 2)}</pre>;
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <main className="p-6 space-y-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p>Signed in as: {userId}</p>
    </main>
  );
}

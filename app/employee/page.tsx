import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ClientConsole from "./ui";

export default async function EmployeePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <main className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">AI Employee Console</h1>
        <p className="text-sm text-slate-600">Signed in as: {userId}</p>
      </div>
      <ClientConsole />
    </main>
  );
}

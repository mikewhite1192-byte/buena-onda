import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import Link from "next/link";

const sql = neon(process.env.DATABASE_URL!);

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const rows = await sql`SELECT id FROM clients WHERE owner_id = ${userId} LIMIT 1`;
  const hasClients = rows.length > 0;

  if (hasClients) redirect("/dashboard/campaigns");

  return (
    <main style={{
      minHeight: "calc(100vh - 52px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Mono', monospace",
      padding: 24,
    }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>✦</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e8f4f4", margin: "0 0 10px" }}>
          Welcome to Buena Onda
        </h1>
        <p style={{ fontSize: 13, color: "#4a7a7a", margin: "0 0 32px", lineHeight: 1.6 }}>
          Connect your first client account to start managing Meta ad campaigns with AI.
        </p>

        <div style={{
          background: "#0d1818",
          border: "1px solid #1a2f2f",
          borderRadius: 12,
          padding: "24px 28px",
          textAlign: "left",
          marginBottom: 28,
        }}>
          <div style={{ fontSize: 11, color: "#2A8C8A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            What you&apos;ll need
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["Meta Ad Account ID", "Found in Meta Business Suite → Ad Accounts. Looks like: 123456789"],
              ["Facebook Page ID", "Go to your Facebook Page → About → scroll to bottom. Looks like: 123456789012345"],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2A8C8A", marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: "#e8f4f4", fontWeight: 600 }}>{title}</div>
                  <div style={{ fontSize: 11, color: "#4a7a7a", marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/dashboard/clients" style={{
          display: "inline-block",
          background: "#2A8C8A",
          color: "#fff",
          borderRadius: 8,
          padding: "11px 28px",
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
          fontFamily: "'DM Mono', monospace",
        }}>
          Add your first client →
        </Link>
      </div>
    </main>
  );
}

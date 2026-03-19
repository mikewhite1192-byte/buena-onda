import { NextResponse } from "next/server";
import { testConnection } from "@/lib/meta/client";

export async function GET() {
  try {
    const result = await testConnection();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

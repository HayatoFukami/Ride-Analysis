import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Log out: delete the database session and clear the session cookie. */
export async function POST() {
  await deleteSession();
  return NextResponse.json({ ok: true });
}
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

/**
 * Get the authenticated user's ID.
 * Redirects to /login if not authenticated.
 * Use in Server Components and Server Actions.
 */
export async function getRequiredUser(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

/**
 * Get the authenticated user's ID for API routes.
 * Returns a 401 response if not authenticated.
 */
export async function getRequiredUserApi(): Promise<string | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session.user.id;
}

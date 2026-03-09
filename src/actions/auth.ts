"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function login(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/",
    });
  } catch (error) {
    // Re-throw Next.js redirect errors so the redirect actually happens
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    return { error: "Something went wrong" };
  }
}

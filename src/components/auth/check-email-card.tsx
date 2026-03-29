"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resendVerificationEmail } from "@/actions/auth";
import { toast } from "sonner";
import { MailIcon } from "lucide-react";

export function CheckEmailCard({ email }: { email: string }) {
  const [cooldown, setCooldown] = useState(false);

  async function handleResend() {
    setCooldown(true);
    const result = await resendVerificationEmail(email);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Verification email sent!");
    }
    setTimeout(() => setCooldown(false), 60_000);
  }

  return (
    <Card className="retro-bevel w-full max-w-sm">
      <CardHeader className="text-center">
        <h1 className="font-pixel text-lg tracking-tight text-primary mb-1">
          TimeTrack
        </h1>
        <div className="flex justify-center mb-2">
          <MailIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <CardTitle className="text-base">Check your email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          We sent a verification link to{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "your email"
          )}
          . Click it to verify your account.
        </p>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={cooldown || !email}
        >
          {cooldown ? "Email sent — check your inbox" : "Resend verification email"}
        </Button>

        <p className="text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            Continue to app
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

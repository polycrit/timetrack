import { consumeVerificationToken } from "@/lib/verification-token";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircleIcon, XCircleIcon } from "lucide-react";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <ResultCard
        success={false}
        title="Invalid link"
        message="This verification link is missing required parameters."
      />
    );
  }

  const success = await consumeVerificationToken(email, token);

  if (success) {
    return (
      <ResultCard
        success={true}
        title="Email verified"
        message="Your email has been verified. You can now use all features."
      />
    );
  }

  return (
    <ResultCard
      success={false}
      title="Link expired or invalid"
      message="This verification link has expired or has already been used. Please request a new one from the sign-up page."
    />
  );
}

function ResultCard({
  success,
  title,
  message,
}: {
  success: boolean;
  title: string;
  message: string;
}) {
  return (
    <Card className="retro-bevel w-full max-w-sm">
      <CardHeader className="text-center">
        <h1 className="font-pixel text-lg tracking-tight text-primary mb-1">
          TimeTrack
        </h1>
        <div className="flex justify-center mb-2">
          {success ? (
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          ) : (
            <XCircleIcon className="h-10 w-10 text-destructive" />
          )}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Link
          href={success ? "/" : "/login"}
          className="inline-block text-sm text-primary hover:underline"
        >
          {success ? "Go to app" : "Back to login"}
        </Link>
      </CardContent>
    </Card>
  );
}

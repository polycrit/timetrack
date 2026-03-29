import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_EXPIRY_HOURS = 24;

export async function generateVerificationToken(email: string): Promise<string> {
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

export async function consumeVerificationToken(
  email: string,
  token: string
): Promise<boolean> {
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!record || record.expires < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      });
    }
    return false;
  }

  await prisma.$transaction([
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    }),
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
  ]);

  return true;
}

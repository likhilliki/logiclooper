import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    (() => {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        console.warn("Google OAuth credentials missing from environment variables");
      }
      if (!process.env.NEXTAUTH_URL) {
        console.warn("NEXTAUTH_URL is not set in environment variables");
      }
      return GoogleProvider({
        clientId: clientId || "",
        clientSecret: clientSecret || "",
        allowDangerousEmailAccountLinking: true,
      });
    })(),
    // Truecaller / Guest Credentials Provider
    CredentialsProvider({
      id: "truecaller",
      name: "Truecaller",
      credentials: {
        payload: { label: "Payload", type: "text" },
      },
      async authorize(credentials) {
        // This is a placeholder for Truecaller SDK verification logic
        // In a real app, you would verify the Truecaller payload here
        if (credentials?.payload) {
          return { id: "truecaller-user", name: "Truecaller User", email: "truecaller@example.com" };
        }
        return null;
      },
    }),
  ].filter(Boolean) as any[],
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Always enable debug for now to help the user
  session: {
    strategy: "database",
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user && user) {
        session.user.id = user.id;
        try {
          // Fetch full user to get latest stats
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { referralCode: true, totalPoints: true, streakCount: true },
          });
          session.user.referralCode = dbUser?.referralCode || undefined;
          session.user.totalPoints = dbUser?.totalPoints || 0;
          session.user.streakCount = dbUser?.streakCount || 0;
        } catch (error) {
          console.error("Error fetching user data for session:", error);
        }
      }
      return session;
    },
  },
};

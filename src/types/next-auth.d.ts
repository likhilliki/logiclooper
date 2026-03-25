import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      referralCode?: string;
      totalPoints: number;
      streakCount: number;
    } & DefaultSession["user"];
  }
}

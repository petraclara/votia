import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { organizer: true },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizerId: user.organizer?.id ?? null,
          organizerStatus: user.organizer?.status ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizerId = user.organizerId;
        token.organizerStatus = user.organizerStatus;
      }

      // Refresh organizer approval from DB so admin Approve takes effect without re-login.
      if (token.id && token.role === "ORGANIZER") {
        const organizer = await prisma.organizer.findUnique({
          where: { userId: token.id as string },
          select: { id: true, status: true },
        });
        token.organizerId = organizer?.id ?? null;
        token.organizerStatus = organizer?.status ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.organizerId = token.organizerId;
        session.user.organizerStatus = token.organizerStatus;
      }
      return session;
    },
  },
};

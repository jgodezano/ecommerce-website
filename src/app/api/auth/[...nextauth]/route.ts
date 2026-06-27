import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // In production, verify against database with bcrypt
        // const user = await db.customers.findUnique({ where: { email: credentials.email } });
        // if (!user || !await bcrypt.compare(credentials.password, user.password_hash)) return null;

        // Mock authentication for development
        if (credentials.email === "user@mericahouseofrocks.ph" && credentials.password === "password") {
          return {
            id: "1",
            email: credentials.email,
            name: "Juan Dela Cruz",
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/account",
    error: "/account",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

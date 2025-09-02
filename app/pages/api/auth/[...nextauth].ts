import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// TODO: Fix NextAuth TypeScript types for accessToken and userId
// Currently commented out to avoid TS errors - needs proper type extensions
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        // TODO: Properly type these properties
        // token.accessToken = account.access_token;
        // token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // TODO: Properly type these properties
      // session.accessToken = token.accessToken;
      // session.userId = token.userId;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);

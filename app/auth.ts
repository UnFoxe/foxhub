import NextAuth from "next-auth";
import Yandex from "next-auth/providers/yandex";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }

  interface JWT {
    accessToken?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || "DJG4dyY7yxi0Npcx45KwacixVKZVKdA",
  trustHost: true, 
  providers: [
    Yandex({
      clientId: process.env.AUTH_YANDEX_ID || "de3e4ea73b8c4cff9bc5939b15e176f8",
      clientSecret: process.env.AUTH_YANDEX_SECRET || "1ee3371a798c4b8483167461b7802037",
      authorization: {
        url: "https://oauth.yandex.ru/authorize", 
        params: {
          scope: "login:info cloud_api:disk.read cloud_api:disk.write cloud_api:disk.info",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
});
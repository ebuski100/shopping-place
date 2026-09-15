import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

type GoogleUser = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export async function GET(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  try {
    // ---------------------------------------
    // 1. OAuth parameters
    // ---------------------------------------

    const url = new URL(request.url);

    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");

    const oauthError = url.searchParams.get("error");

    // ---------------------------------------
    // 2. Handle Google OAuth errors
    // ---------------------------------------

    if (oauthError) {
      console.error("Google OAuth error:", oauthError);

      return NextResponse.redirect(`${appUrl}/login?error=google_denied`);
    }

    // ---------------------------------------
    // 3. Make sure code and state exist
    // ---------------------------------------

    if (!code || !returnedState) {
      return NextResponse.redirect(`${appUrl}/login?error=google`);
    }

    // ---------------------------------------
    // 4. Get stored OAuth values
    // ---------------------------------------

    const cookieStore = await cookies();

    const storedState = cookieStore.get("google_oauth_state")?.value;

    const codeVerifier = cookieStore.get("google_oauth_code_verifier")?.value;

    // ---------------------------------------
    // 5. Verify state
    // ---------------------------------------

    if (!storedState || storedState !== returnedState || !codeVerifier) {
      console.error("Google OAuth state or PKCE verification failed");

      return NextResponse.redirect(`${appUrl}/login?error=google`);
    }

    // ---------------------------------------
    // 6. Delete OAuth cookies immediately
    // ---------------------------------------

    cookieStore.delete("google_oauth_state");

    cookieStore.delete("google_oauth_code_verifier");

    // ---------------------------------------
    // 7. Get credentials
    // ---------------------------------------

    const clientId = process.env.GOOGLE_CLIENT_ID;

    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials are missing");
    }

    // ---------------------------------------
    // 8. Exchange authorization code
    // ---------------------------------------

    const redirectUri = `${appUrl}/api/auth/google/callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",

      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },

      body: new URLSearchParams({
        code,

        client_id: clientId,

        client_secret: clientSecret,

        redirect_uri: redirectUri,

        grant_type: "authorization_code",

        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      console.error(
        "Google token exchange failed:",
        await tokenResponse.text(),
      );

      return NextResponse.redirect(`${appUrl}/login?error=google_token`);
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return NextResponse.redirect(`${appUrl}/login?error=google_token`);
    }

    // ---------------------------------------
    // 9. Get Google user
    // ---------------------------------------

    const userResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },

        cache: "no-store",
      },
    );

    if (!userResponse.ok) {
      console.error("Failed to fetch Google user:", await userResponse.text());

      return NextResponse.redirect(`${appUrl}/login?error=google_user`);
    }

    const googleUser: GoogleUser = await userResponse.json();

    // ---------------------------------------
    // 10. Validate Google identity
    // ---------------------------------------

    if (!googleUser.sub || !googleUser.email || !googleUser.email_verified) {
      return NextResponse.redirect(`${appUrl}/login?error=google_profile`);
    }

    const googleId = googleUser.sub;

    const email = googleUser.email.toLowerCase().trim();

    const name = googleUser.name ?? null;

    // ---------------------------------------
    // 11. Find existing Google account
    // ---------------------------------------

    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: googleId,
        },
      },

      include: {
        user: true,
      },
    });

    let user;

    // ---------------------------------------
    // 12. Existing Google account
    // ---------------------------------------

    if (existingAccount) {
      user = existingAccount.user;
    }

    // ---------------------------------------
    // 13. No Google account yet
    // ---------------------------------------
    else {
      // Check whether email already exists

      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      // -------------------------------------
      // Existing user
      // -------------------------------------

      if (existingUser) {
        user = existingUser;

        // Link Google account

        await prisma.account.create({
          data: {
            userId: user.id,

            provider: "google",

            providerAccountId: googleId,
          },
        });
      }

      // -------------------------------------
      // Completely new user
      // -------------------------------------
      else {
        user = await prisma.user.create({
          data: {
            name,

            email,

            password: null,
          },
        });

        await prisma.account.create({
          data: {
            userId: user.id,

            provider: "google",

            providerAccountId: googleId,
          },
        });
      }
    }

    // ---------------------------------------
    // 14. Check account status
    // ---------------------------------------

    if (!user.isActive) {
      return NextResponse.redirect(`${appUrl}/login?error=account_disabled`);
    }

    // ---------------------------------------
    // 15. Create application session
    // ---------------------------------------

    const sessionId = randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        id: sessionId,

        userId: user.id,

        expiresAt,
      },
    });

    // ---------------------------------------
    // 16. Set session cookie
    // ---------------------------------------

    cookieStore.set("sessionId", sessionId, {
      httpOnly: true,

      secure: process.env.NODE_ENV === "production",

      sameSite: "lax",

      expires: expiresAt,

      path: "/",
    });

    // ---------------------------------------
    // 17. OAuth success page
    // ---------------------------------------

    return NextResponse.redirect(`${appUrl}/auth/oauth-success`);
  } catch (error) {
    console.error("Google OAuth callback error:", error);

    return NextResponse.redirect(`${appUrl}/login?error=google_failed`);
  }
}

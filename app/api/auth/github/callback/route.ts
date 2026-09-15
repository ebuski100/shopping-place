import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type GitHubUser = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
};

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

export async function GET(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // ---------------------------------------
  // 0. Make sure application URL exists
  // ---------------------------------------

  if (!appUrl) {
    console.error(
      "GitHub OAuth callback error: NEXT_PUBLIC_APP_URL is missing",
    );

    return NextResponse.redirect(new URL("/login?error=github", request.url));
  }

  try {
    // ---------------------------------------
    // 1. Get OAuth parameters
    // ---------------------------------------

    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const returnedState = searchParams.get("state");
    const oauthError = searchParams.get("error");

    // ---------------------------------------
    // 2. Handle GitHub OAuth errors
    // ---------------------------------------

    if (oauthError) {
      console.error("GitHub OAuth error returned by GitHub:", oauthError);

      return NextResponse.redirect(new URL("/login?error=github", appUrl));
    }

    // ---------------------------------------
    // 3. Make sure code and state exist
    // ---------------------------------------

    if (!code || !returnedState) {
      console.error(
        "GitHub OAuth callback missing authorization code or state",
      );

      return NextResponse.redirect(new URL("/login?error=github", appUrl));
    }

    // ---------------------------------------
    // 4. Get stored OAuth state and PKCE verifier
    // ---------------------------------------

    const cookieStore = await cookies();

    const storedState = cookieStore.get("github_oauth_state")?.value;

    const codeVerifier = cookieStore.get("github_oauth_code_verifier")?.value;

    // ---------------------------------------
    // 5. Verify OAuth state + PKCE
    // ---------------------------------------

    if (!storedState) {
      console.error("GitHub OAuth state cookie is missing");

      return NextResponse.redirect(new URL("/login?error=github", appUrl));
    }

    if (storedState !== returnedState) {
      console.error("GitHub OAuth state mismatch");

      return NextResponse.redirect(new URL("/login?error=github", appUrl));
    }

    if (!codeVerifier) {
      console.error("GitHub OAuth PKCE code verifier is missing");

      return NextResponse.redirect(new URL("/login?error=github", appUrl));
    }

    // ---------------------------------------
    // 6. OAuth state successfully verified
    //    Delete OAuth cookies immediately
    // ---------------------------------------

    cookieStore.delete("github_oauth_state");
    cookieStore.delete("github_oauth_code_verifier");

    // ---------------------------------------
    // 7. Get GitHub credentials
    // ---------------------------------------

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("GitHub OAuth credentials are missing");

      return NextResponse.redirect(new URL("/login?error=github", appUrl));
    }

    // ---------------------------------------
    // 8. Exchange authorization code
    //    for GitHub access token
    // ---------------------------------------

    const redirectUri = `${appUrl}/api/auth/github/callback`;

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",

        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),

        cache: "no-store",
      },
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("GitHub token exchange failed:", tokenData);

      return NextResponse.redirect(new URL("/login?error=github", appUrl));
    }

    const accessToken = tokenData.access_token;

    // ---------------------------------------
    // 9. Get GitHub user
    // ---------------------------------------

    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },

      cache: "no-store",
    });

    if (!githubUserResponse.ok) {
      console.error(
        "Failed to fetch GitHub user:",
        await githubUserResponse.text(),
      );

      return NextResponse.redirect(new URL("/login?error=github", appUrl));
    }

    const githubUser: GitHubUser = await githubUserResponse.json();

    // ---------------------------------------
    // 10. Get GitHub emails
    // ---------------------------------------

    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },

      cache: "no-store",
    });

    if (!emailResponse.ok) {
      console.error(
        "Failed to fetch GitHub emails:",
        await emailResponse.text(),
      );

      return NextResponse.redirect(new URL("/login?error=github", appUrl));
    }

    const emails: GitHubEmail[] = await emailResponse.json();

    // ---------------------------------------
    // 11. Find verified email
    // ---------------------------------------

    const primaryEmail =
      emails.find((email) => email.primary && email.verified)?.email ??
      emails.find((email) => email.verified)?.email;

    if (!primaryEmail) {
      console.error("GitHub account does not have a verified email");

      return NextResponse.redirect(new URL("/login?error=no-email", appUrl));
    }

    const normalizedEmail = primaryEmail.toLowerCase().trim();

    // ---------------------------------------
    // 12. Find existing GitHub account
    // ---------------------------------------

    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId: String(githubUser.id),
        },
      },

      include: {
        user: true,
      },
    });

    let user;

    // ---------------------------------------
    // 13. Existing GitHub account
    // ---------------------------------------

    if (existingAccount) {
      user = existingAccount.user;
    }

    // ---------------------------------------
    // 14. No GitHub account yet
    // ---------------------------------------
    else {
      // ---------------------------------------
      // Check whether email already exists
      // ---------------------------------------

      const existingUser = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      // ---------------------------------------
      // Existing user
      // ---------------------------------------

      if (existingUser) {
        user = existingUser;

        // Link GitHub account to existing user

        await prisma.account.create({
          data: {
            userId: user.id,
            provider: "github",
            providerAccountId: String(githubUser.id),
          },
        });
      }

      // ---------------------------------------
      // Completely new user
      // ---------------------------------------
      else {
        user = await prisma.user.create({
          data: {
            name: githubUser.name ?? githubUser.login,

            email: normalizedEmail,

            password: null,
          },
        });

        await prisma.account.create({
          data: {
            userId: user.id,

            provider: "github",

            providerAccountId: String(githubUser.id),
          },
        });
      }
    }

    // ---------------------------------------
    // 15. Check account status
    // ---------------------------------------

    if (!user.isActive) {
      console.error("GitHub login attempted by deactivated user:", user.id);

      return NextResponse.redirect(new URL("/login?error=deactivated", appUrl));
    }

    // ---------------------------------------
    // 16. Create application session
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
    // 17. Set secure session cookie
    // ---------------------------------------

    cookieStore.set("sessionId", sessionId, {
      httpOnly: true,

      secure: process.env.NODE_ENV === "production",

      sameSite: "lax",

      expires: expiresAt,

      path: "/",
    });

    // ---------------------------------------
    // 18. Redirect to OAuth success page
    // ---------------------------------------

    return NextResponse.redirect(new URL("/auth/oauth-success", appUrl));
  } catch (error) {
    // ---------------------------------------
    // 19. Server-side error logging
    // ---------------------------------------

    console.error("GitHub OAuth callback error:", error);

    // ---------------------------------------
    // Never expose internal error details
    // to the browser
    // ---------------------------------------

    return NextResponse.redirect(new URL("/login?error=github", appUrl));
  }
}

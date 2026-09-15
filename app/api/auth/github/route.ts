import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function GET() {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!clientId || !appUrl) {
      throw new Error("GitHub OAuth configuration is missing");
    }

    // ---------------------------------------
    // 1. Generate CSRF state
    // ---------------------------------------

    const state = randomBytes(32).toString("hex");

    // ---------------------------------------
    // 2. Generate PKCE code verifier
    // ---------------------------------------

    const codeVerifier = base64UrlEncode(randomBytes(32));

    // ---------------------------------------
    // 3. Generate PKCE code challenge
    // ---------------------------------------

    const codeChallenge = base64UrlEncode(
      createHash("sha256").update(codeVerifier).digest(),
    );

    // ---------------------------------------
    // 4. Store state + verifier
    // ---------------------------------------

    const cookieStore = await cookies();

    cookieStore.set("github_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60,
      path: "/",
    });

    cookieStore.set("github_oauth_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60,
      path: "/",
    });

    // ---------------------------------------
    // 5. Build GitHub authorization URL
    // ---------------------------------------

    const params = new URLSearchParams({
      client_id: clientId,

      redirect_uri: `${appUrl}/api/auth/github/callback`,

      scope: "read:user user:email",

      state,

      code_challenge: codeChallenge,

      code_challenge_method: "S256",
    });

    // ---------------------------------------
    // 6. Redirect to GitHub
    // ---------------------------------------

    return NextResponse.redirect(
      `https://github.com/login/oauth/authorize?${params.toString()}`,
    );
  } catch (error) {
    console.error("GitHub OAuth start error:", error);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=github`,
    );
  }
}

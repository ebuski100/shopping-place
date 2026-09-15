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
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!clientId || !appUrl) {
      console.error("Google OAuth configuration is missing");

      return NextResponse.redirect(`${appUrl ?? ""}/login?error=google`);
    }

    // ---------------------------------------
    // 1. Generate OAuth state
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
    // 4. Store OAuth values in HttpOnly cookies
    // ---------------------------------------

    const cookieStore = await cookies();

    cookieStore.set("google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60,
      path: "/",
    });

    cookieStore.set("google_oauth_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60,
      path: "/",
    });

    // ---------------------------------------
    // 5. Build Google authorization URL
    // ---------------------------------------

    const redirectUri = `${appUrl}/api/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",

      scope: "openid email profile",

      state,

      code_challenge: codeChallenge,
      code_challenge_method: "S256",

      // Ask Google to let the user choose
      // which account to use.
      prompt: "select_account",
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // ---------------------------------------
    // 6. Redirect to Google
    // ---------------------------------------

    return NextResponse.redirect(googleAuthUrl);
  } catch (error) {
    console.error("Google OAuth start error:", error);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=google`,
    );
  }
}

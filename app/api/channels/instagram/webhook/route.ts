/**
 * Instagram Webhook Endpoint
 *
 * Receives webhooks from Instagram Graph API
 * TODO: Implement webhook handling
 */

import { NextRequest, NextResponse } from "next/server";
import { InstagramAdapter } from "@/lib/channels/adapters/instagram";

const instagramAdapter = new InstagramAdapter();

export async function POST(request: NextRequest) {
  try {
    // TODO: Validate webhook signature
    // const isValid = await instagramAdapter.validateWebhook(request);
    // if (!isValid) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    // TODO: Parse webhook payload
    // const body = await request.json();
    // const message = await instagramAdapter.receiveMessage(body);

    // TODO: Process message through chat service
    // - Get or create conversation
    // - Generate AI response
    // - Send response back via Instagram

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Instagram webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Instagram webhook verification (GET request)
 * Required for webhook setup
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement webhook verification
    // - Extract verify token and challenge from query params
    // - Verify token matches configured token
    // - Return challenge if valid

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // TODO: Verify token against environment variable
    // if (mode === "subscribe" && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    //   return new NextResponse(challenge, { status: 200 });
    // }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("Instagram webhook verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

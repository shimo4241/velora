import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect to app root with action and eventId parameters
  const redirectUrl = new URL("/", request.url);
  redirectUrl.searchParams.set("action", "checkin");
  redirectUrl.searchParams.set("eventId", eventId);

  return NextResponse.redirect(redirectUrl);
}

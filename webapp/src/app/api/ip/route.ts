import { NextRequest, NextResponse } from "next/server";

const IPREGISTRY_ENDPOINT = "https://api.ipregistry.co";
const IPREGISTRY_KEY = "tryout";

const sanitizeIp = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  return value.split(",")[0]?.trim();
};

export async function GET(req: NextRequest) {
  const forwardedFor = sanitizeIp(req.headers.get("x-forwarded-for"));
  const realIp =
    forwardedFor ||
    sanitizeIp(req.headers.get("x-real-ip")) ||
    sanitizeIp(req.headers.get("x-client-ip")) ||
    undefined;
  const search = realIp ? `/${encodeURIComponent(realIp)}` : "/";
  const url = `${IPREGISTRY_ENDPOINT}${search}?key=${IPREGISTRY_KEY}`;

  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to query upstream IP service",
          status: response.status,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("[/api/ip] Upstream fetch failed", error);
    return NextResponse.json(
      { success: false, message: "Unable to fetch IP details" },
      { status: 500 },
    );
  }
}

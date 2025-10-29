import { NextRequest, NextResponse } from "next/server";
import { performance } from "perf_hooks";

export const runtime = "nodejs";

type PingTarget = {
  id: string;
  name: string;
  host: string;
  url: string;
  headers?: Record<string, string>;
};

const ACCEPT_HEADER = "application/dns-json";

const PING_TARGETS: Record<string, PingTarget> = {
  google: {
    id: "google",
    name: "Google DNS",
    host: "8.8.8.8",
    url: "https://dns.google/resolve?name=example.com&type=A",
    headers: { accept: ACCEPT_HEADER },
  },
  cloudflare: {
    id: "cloudflare",
    name: "Cloudflare DNS",
    host: "1.1.1.1",
    url: "https://cloudflare-dns.com/dns-query?name=example.com&type=A",
    headers: { accept: ACCEPT_HEADER },
  },
  opendns: {
    id: "opendns",
    name: "OpenDNS",
    host: "208.67.222.222",
    url: "https://doh.opendns.com/dns-query?name=example.com&type=A",
    headers: { accept: ACCEPT_HEADER },
  },
  quad9: {
    id: "quad9",
    name: "Quad9 DNS",
    host: "9.9.9.9",
    url: "https://dns.quad9.net/dns-query?name=example.com&type=A",
    headers: { accept: ACCEPT_HEADER },
  },
};

export async function POST(req: NextRequest) {
  let id: string | undefined;

  try {
    const body = await req.json();
    id = typeof body?.id === "string" ? body.id.toLowerCase() : undefined;
  } catch {
    // no-op
  }

  if (!id || !(id in PING_TARGETS)) {
    return NextResponse.json(
      { error: "Invalid or missing ping target id" },
      { status: 400 },
    );
  }

  const target = PING_TARGETS[id];

  try {
    const start = performance.now();
    const response = await fetch(target.url, {
      method: "GET",
      headers: target.headers,
      cache: "no-store",
    });
    await response.arrayBuffer();
    const latencyMs = performance.now() - start;

    return NextResponse.json({
      id: target.id,
      name: target.name,
      host: target.host,
      httpStatus: response.status,
      ok: response.ok,
      latencyMs,
    });
  } catch (error) {
    console.error("[/api/ping] failed", { target: id, error });
    return NextResponse.json(
      {
        id: target.id,
        name: target.name,
        host: target.host,
        ok: false,
        error: "Failed to reach DNS endpoint",
      },
      { status: 504 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    Object.values(PING_TARGETS).map(({ id, name, host }) => ({
      id,
      name,
      host,
    })),
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type Nullable<T> = T | null | undefined;

type IpRegistrySecurity = {
  is_abuser: boolean;
  is_attacker: boolean;
  is_bogon: boolean;
  is_cloud_provider: boolean;
  is_proxy: boolean;
  is_relay: boolean;
  is_tor: boolean;
  is_tor_exit: boolean;
  is_vpn: boolean;
  is_anonymous: boolean;
  is_threat: boolean;
};

type IpRegistryCompany = {
  domain: Nullable<string>;
  name: Nullable<string>;
  type: Nullable<string>;
};

type IpRegistryConnection = {
  asn: Nullable<number>;
  domain: Nullable<string>;
  organization: Nullable<string>;
  route: Nullable<string>;
  type: Nullable<string>;
};

type IpRegistryLocation = {
  city: Nullable<string>;
  region: Nullable<{ code: Nullable<string>; name: Nullable<string> }>;
  country: {
    code: Nullable<string>;
    name: Nullable<string>;
    capital: Nullable<string>;
    calling_code: Nullable<string>;
    flag: {
      emoji: Nullable<string>;
      twemoji: Nullable<string>;
    };
    languages: Nullable<{ code: string; name: string; native: string }[]>;
  };
  postal: Nullable<string>;
  latitude: Nullable<number>;
  longitude: Nullable<number>;
  continent: Nullable<{ code: Nullable<string>; name: Nullable<string> }>;
  in_eu: boolean;
};

type IpRegistryTimeZone = {
  id: Nullable<string>;
  abbreviation: Nullable<string>;
  current_time: Nullable<string>;
  offset: Nullable<number>;
  in_daylight_saving: Nullable<boolean>;
};

type IpRegistryResponse = {
  ip: string;
  type: string;
  hostname: Nullable<string>;
  carrier: Nullable<{ name: Nullable<string> }>;
  company: IpRegistryCompany;
  connection: IpRegistryConnection;
  location: IpRegistryLocation;
  security: IpRegistrySecurity;
  time_zone: IpRegistryTimeZone;
  user_agent?: {
    name: Nullable<string>;
    version: Nullable<string>;
    type: Nullable<string>;
    os: Nullable<{ name: Nullable<string>; version: Nullable<string> }>;
    device: Nullable<{ name: Nullable<string>; type: Nullable<string> }>;
  };
};

type PingMeasurement = {
  id: string;
  name: string;
  host: string;
  ok: boolean;
  latencyMs?: number;
  httpStatus?: number;
  error?: string;
  isLoading?: boolean;
};

const formatNumber = (value: Nullable<number>, fractionDigits = 2) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "Unknown";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

const booleanChip = (value: boolean, label: string) => ({
  label,
  value,
});

const pingTargets: PingMeasurement[] = [
  { id: "google", name: "Google DNS", host: "8.8.8.8", ok: false },
  { id: "cloudflare", name: "Cloudflare DNS", host: "1.1.1.1", ok: false },
  { id: "opendns", name: "OpenDNS", host: "208.67.222.222", ok: false },
  { id: "quad9", name: "Quad9 DNS", host: "9.9.9.9", ok: false },
];

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: Nullable<string> | ReactNode;
}) => {
  const displayValue =
    value === null || value === undefined || value === ""
      ? "Unknown"
      : value;

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white/60 p-3 shadow-sm shadow-black/5 transition hover:border-zinc-300 hover:shadow-black/10 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-white/[0.16]">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="break-words text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {displayValue}
      </span>
    </div>
  );
};

const SecurityBadge = ({ label, active }: { label: string; active: boolean }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
      active
        ? "bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-500/40 dark:bg-red-400/10 dark:text-red-200"
        : "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200"
    }`}
  >
    <span className="h-2 w-2 rounded-full bg-current" />
    {label}
  </span>
);

const PingCard = ({ measurement }: { measurement: PingMeasurement }) => {
  const statusText = measurement.isLoading
    ? "Pinging…"
    : measurement.ok
      ? `${measurement.latencyMs?.toFixed(1)} ms`
      : measurement.error ?? "Unavailable";

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white/60 p-4 shadow-sm shadow-black/5 dark:border-white/[0.08] dark:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {measurement.name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{measurement.host}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            measurement.isLoading
              ? "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-200"
              : measurement.ok
                ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200"
                : "bg-red-500/10 text-red-500 dark:bg-red-400/10 dark:text-red-200"
          }`}
        >
          {statusText}
        </span>
      </div>
      {measurement.httpStatus && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          HTTP status: {measurement.httpStatus}
        </p>
      )}
    </div>
  );
};

const usePingMeasurements = () => {
  const [measurements, setMeasurements] = useState<PingMeasurement[]>(pingTargets);

  const updateMeasurement = useCallback((id: string, partial: Partial<PingMeasurement>) => {
    setMeasurements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...partial } : item)),
    );
  }, []);

  const ping = useCallback(async (id: string) => {
    updateMeasurement(id, { isLoading: true, error: undefined });
    try {
      const response = await fetch("/api/ping", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await response.json();

      updateMeasurement(id, {
        ok: Boolean(payload.ok),
        latencyMs: typeof payload.latencyMs === "number" ? payload.latencyMs : undefined,
        httpStatus: payload.httpStatus,
        error: payload.error,
        isLoading: false,
      });
    } catch (error) {
      console.error("Ping failed", error);
      updateMeasurement(id, {
        ok: false,
        error: "Ping error",
        isLoading: false,
      });
    }
  }, [updateMeasurement]);

  const pingAll = useCallback(() => {
    pingTargets.forEach((target) => {
      void ping(target.id);
    });
  }, [ping]);

  return { measurements, ping, pingAll };
};

export default function Home() {
  const [ipData, setIpData] = useState<IpRegistryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const { measurements, ping, pingAll } = usePingMeasurements();

  useEffect(() => {
    let active = true;

    const fetchIpData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/ip", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message ?? "Unable to resolve IP information");
        }

        if (active) {
          setIpData(payload as IpRegistryResponse);
        }
      } catch (err) {
        console.error("Failed to load IP data", err);
        if (active) {
          setError("Failed to load IP intelligence data. Try refreshing.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchIpData();

    return () => {
      active = false;
    };
  }, [refreshCount]);

  useEffect(() => {
    pingAll();
  }, [pingAll]);

  const securityBadges = useMemo(() => {
    if (!ipData?.security) return [];
    return [
      booleanChip(ipData.security.is_vpn, "VPN"),
      booleanChip(ipData.security.is_proxy, "Proxy"),
      booleanChip(ipData.security.is_tor, "Tor"),
      booleanChip(ipData.security.is_cloud_provider, "Cloud Provider"),
      booleanChip(ipData.security.is_threat, "Threat"),
    ];
  }, [ipData]);

  const locationDetails = useMemo(() => {
    if (!ipData?.location) return [];
    const location = ipData.location;
    const countryName = location.country?.name ?? null;
    const countryCode = location.country?.code ?? null;
    const regionName = location.region?.name ?? null;
    const regionCode = location.region?.code ?? null;
    const continentName = location.continent?.name ?? null;
    const continentCode = location.continent?.code ?? null;
    const flagEmoji = location.country?.flag?.emoji ?? null;

    const mapLink =
      typeof location.latitude === "number" && typeof location.longitude === "number"
        ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
        : null;

    return [
      { label: "Country", value: [countryName, countryCode].filter(Boolean).join(" · ") || null },
      { label: "Region", value: [regionName, regionCode].filter(Boolean).join(" · ") || null },
      { label: "City", value: location.city },
      { label: "Postal Code", value: location.postal },
      {
        label: "Coordinates",
        value:
          mapLink && location.latitude != null && location.longitude != null
            ? `${formatNumber(location.latitude, 4)}, ${formatNumber(location.longitude, 4)}`
            : null,
        link: mapLink ?? undefined,
      },
      {
        label: "Continent",
        value: [continentName, continentCode].filter(Boolean).join(" · ") || null,
      },
      {
        label: "In European Union",
        value: location.in_eu ? "Yes" : "No",
      },
      {
        label: "Flag",
        value: flagEmoji,
      },
    ];
  }, [ipData]);

  const connectionDetails = useMemo(() => {
    if (!ipData?.connection) return [];
    return [
      { label: "ASN", value: ipData.connection.asn ? `AS${ipData.connection.asn}` : null },
      { label: "Provider", value: ipData.connection.organization },
      { label: "Route", value: ipData.connection.route },
      { label: "Domain", value: ipData.connection.domain },
      { label: "Type", value: ipData.connection.type },
    ];
  }, [ipData]);

  const networkDetails = useMemo(() => {
    if (!ipData) return [];
    const company = ipData.company ?? {};
    return [
      { label: "Hostname", value: ipData.hostname },
      { label: "Company", value: company.name },
      { label: "Company Domain", value: company.domain },
      { label: "Company Type", value: company.type },
      { label: "Carrier", value: ipData.carrier?.name ?? null },
    ];
  }, [ipData]);

  const timezoneDetails = useMemo(() => {
    if (!ipData?.time_zone) return [];
    const tz = ipData.time_zone;
    const formattedTime =
      tz.current_time != null
        ? new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "medium",
          }).format(new Date(tz.current_time))
        : "Unknown";
    return [
      { label: "Timezone", value: tz.id },
      { label: "Abbreviation", value: tz.abbreviation },
      {
        label: "UTC Offset",
        value:
          typeof tz.offset === "number"
            ? `${tz.offset >= 0 ? "+" : ""}${(tz.offset / 3600).toFixed(1)}h`
            : null,
      },
      {
        label: "Daylight Saving",
        value: tz.in_daylight_saving == null ? null : tz.in_daylight_saving ? "Yes" : "No",
      },
      { label: "Local Time", value: formattedTime },
    ];
  }, [ipData]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f5f5,_#e4e4f5)] py-10 font-sans text-zinc-900 dark:bg-[radial-gradient(circle_at_top,_#0b1220,_#05060a)] dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-3xl border border-white/60 bg-white/70 p-8 shadow-xl shadow-black/5 backdrop-blur dark:border-white/[0.08] dark:bg-white/[0.06] dark:shadow-black/50">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-white/[0.08]">
          <div>
            <h1 className="text-3xl font-semibold md:text-4xl">Device Intelligence Dashboard</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Real-time visibility into your network footprint, security posture, and latency to
              major public resolvers.
            </p>
          </div>
          {loading ? (
            <div className="rounded-xl border border-dashed border-zinc-400 bg-white/50 px-4 py-6 text-sm text-zinc-600 dark:border-white/[0.16] dark:bg-transparent dark:text-zinc-400">
              Gathering IP intelligence…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-300 bg-red-50/70 px-4 py-6 text-sm font-medium text-red-600 dark:border-red-500/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : ipData ? (
            <div className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-black/5 dark:border-white/[0.08] dark:bg-white/[0.04]">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 rounded-2xl bg-zinc-900 px-5 py-3 text-white shadow-sm shadow-black/30 dark:bg-white/10 dark:text-white">
                  <span className="text-xs uppercase text-white/70">Public IP</span>
                  <span className="text-xl font-semibold tracking-wide">{ipData.ip}</span>
                </div>
                <div className="rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase text-zinc-600 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-zinc-300">
                  {ipData.type}
                </div>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {networkDetails.map((item) => (
                  <InfoRow key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
              {securityBadges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {securityBadges.map((badge) => (
                    <SecurityBadge key={badge.label} label={badge.label} active={badge.value} />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm shadow-black/5 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Location Intelligence</h2>
              {ipData?.location?.country?.flag?.emoji && (
                <span className="text-3xl" role="img" aria-label="Country flag">
                  {ipData.location.country.flag.emoji}
                </span>
              )}
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              {locationDetails.map((item) => (
                <div key={item.label}>
                  <InfoRow
                    label={item.label}
                    value={
                      item.link && item.value ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 underline decoration-dotted underline-offset-4 hover:text-emerald-700 dark:text-emerald-300"
                        >
                          {item.value}
                        </a>
                      ) : (
                        item.value
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </article>

          <article className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm shadow-black/5 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <h2 className="text-lg font-semibold">Connection & Routing</h2>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              {connectionDetails.map((item) => (
                <InfoRow key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <article className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm shadow-black/5 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Security Assessment</h2>
              <button
                type="button"
                className="rounded-full border border-zinc-200 px-4 py-1 text-xs font-semibold text-zinc-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/[0.12] dark:text-zinc-300 dark:hover:border-emerald-300 dark:hover:text-emerald-200"
                onClick={() => {
                  setIpData(null);
                  setError(null);
                  setLoading(true);
                  setRefreshCount((count) => count + 1);
                }}
              >
                Refresh
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ipData?.security ? (
                Object.entries(ipData.security).map(([key, value]) => (
                  <SecurityBadge
                    key={key}
                    label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    active={Boolean(value)}
                  />
                ))
              ) : (
                <span className="text-sm text-zinc-500">Security data unavailable.</span>
              )}
            </div>
            {ipData?.company?.type === "hosting" && (
              <p className="rounded-xl border border-amber-300/80 bg-amber-50/60 px-4 py-3 text-xs font-medium text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                Connection originates from a hosting provider. This often indicates VPN, proxy, or
                cloud infrastructure usage.
              </p>
            )}
          </article>

          <article className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm shadow-black/5 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Resolver Latency</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  HTTP-based pings to major public DNS resolvers.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => pingAll()}
                  className="rounded-lg border border-emerald-400 bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100 dark:border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
                >
                  Ping All
                </button>
                {measurements.map((measurement) => (
                  <button
                    key={measurement.id}
                    onClick={() => void ping(measurement.id)}
                    className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/[0.12] dark:text-zinc-300 dark:hover:border-emerald-300 dark:hover:text-emerald-200"
                  >
                    {measurement.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {measurements.map((measurement) => (
                <PingCard key={measurement.id} measurement={measurement} />
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm shadow-black/5 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <h2 className="text-lg font-semibold">Timezone & Environment</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {timezoneDetails.map((item) => (
              <InfoRow key={item.label} label={item.label} value={item.value} />
            ))}
            {ipData?.user_agent?.name && (
              <>
                <InfoRow
                  label="User Agent"
                  value={`${ipData.user_agent.name} ${ipData.user_agent.version ?? ""}`.trim()}
                />
                <InfoRow
                  label="Operating System"
                  value={[
                    ipData.user_agent.os?.name,
                    ipData.user_agent.os?.version,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
                <InfoRow
                  label="Device"
                  value={[
                    ipData.user_agent.device?.name,
                    ipData.user_agent.device?.type,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
              </>
            )}
          </div>
        </section>

        <footer className="text-xs text-zinc-500 dark:text-zinc-400">
          Latency benchmarks rely on HTTPS fetches to DNS over HTTPS providers. Results reflect
          current network egress from this deployment and may differ from raw ICMP pings.
        </footer>
      </main>
    </div>
  );
}

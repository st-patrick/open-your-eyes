import { useEffect, useState } from "react";

const API = "/api";

interface Provider {
  name: string;
  role: string;
  account?: string;
  status?: string;
  validated_at?: string;
  credential_keys?: string[];
  domains?: Array<{ name: string; id?: number }>;
}

interface LaunchedProject {
  name: string;
  url: string;
  itch?: string;
  type: string;
  tags: string[];
  description: string;
}

interface BuriedProject {
  name: string;
  framework: string;
  hasBuild?: boolean;
  path: string;
}

interface LiveSubdomain {
  name: string;
  url: string;
}

interface StatusData {
  installed: boolean;
  oye_dir: string;
  files: Record<string, boolean>;
}

interface SecretsData {
  [key: string]: { exists: boolean; redacted: string };
}

interface Capabilities {
  configured: boolean;
  capabilities: Record<string, unknown>;
}

interface SnapshotData {
  status: StatusData;
  providers: Provider[];
  secrets: SecretsData;
  capabilities: Capabilities;
  launched?: LaunchedProject[];
  buried?: BuriedProject[];
  liveSubdomains?: LiveSubdomain[];
  generated_at?: string;
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: ok ? "#22c55e" : "#ef4444",
        marginRight: 8,
      }}
    />
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#1a1a2e",
        borderRadius: 12,
        padding: 24,
        border: "1px solid #2a2a4a",
      }}
    >
      <h2
        style={{
          margin: "0 0 16px 0",
          fontSize: 14,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "#888",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

const typeColors: Record<string, string> = {
  game: "#f59e0b",
  creative: "#a78bfa",
  business: "#22c55e",
  tool: "#60a5fa",
  event: "#f472b6",
};

function App() {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try live API first, fall back to static snapshot
    fetch(`${API}/status`)
      .then((r) => {
        if (!r.ok) throw new Error("API not available");
        return Promise.all([
          r.json(),
          fetch(`${API}/providers`).then((r) => r.json()),
          fetch(`${API}/secrets`).then((r) => r.json()),
          fetch(`${API}/capabilities`).then((r) => r.json()),
        ]);
      })
      .then(([status, providers, secrets, capabilities]) => {
        // Live API — merge with snapshot for launched/buried data
        fetch("/snapshot.json")
          .then((r) => r.json())
          .then((snap) => {
            setData({
              status,
              providers,
              secrets,
              capabilities,
              launched: snap.launched || [],
              buried: snap.buried || [],
              liveSubdomains: snap.liveSubdomains || [],
              generated_at: snap.generated_at,
            });
          })
          .catch(() => {
            setData({ status, providers, secrets, capabilities });
          });
      })
      .catch(() => {
        // Fall back to static snapshot
        fetch("/snapshot.json")
          .then((r) => r.json())
          .then((snap: SnapshotData) => setData(snap))
          .catch(() =>
            setError("No data available. Run locally or rebuild with snapshot.")
          );
      });
  }, []);

  if (error) {
    return (
      <div style={rootStyle}>
        <h1 style={{ fontSize: 24 }}>Introdote</h1>
        <p style={{ color: "#ef4444", marginTop: 16 }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={rootStyle}>
        <p style={{ color: "#888" }}>Loading...</p>
      </div>
    );
  }

  const launched = data.launched || [];
  const buried = data.buried || [];
  const liveSubdomains = data.liveSubdomains || [];
  const providers = data.providers || [];

  return (
    <div style={rootStyle}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, margin: "0 0 4px 0", fontWeight: 700 }}>
          Introdote
        </h1>
        <p style={{ margin: 0, color: "#888", fontSize: 14 }}>
          Your projects don't stay buried.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: 20,
        }}
      >
        {/* Launched Projects */}
        <Card title={`Launched (${launched.length})`}>
          {launched.length === 0 ? (
            <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
              Nothing launched yet. Say "introdote" in any project.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {launched.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    padding: 12,
                    background: "#12121f",
                    borderRadius: 8,
                    border: "1px solid #2a2a4a",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <strong style={{ fontSize: 15, color: "#e0e0e0" }}>
                      {p.name}
                    </strong>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: (typeColors[p.type] || "#888") + "22",
                        color: typeColors[p.type] || "#888",
                        fontWeight: 600,
                      }}
                    >
                      {p.type}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "0 0 6px 0",
                      fontSize: 13,
                      color: "#888",
                      lineHeight: 1.4,
                    }}
                  >
                    {p.description}
                  </p>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "#1a1a2e",
                          color: "#666",
                          border: "1px solid #2a2a4a",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {p.itch && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#555" }}>
                      Also on{" "}
                      <span style={{ color: "#f472b6" }}>itch.io</span>
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </Card>

        {/* Live Subdomains */}
        <Card title={`Live on patrickreinbold.com (${liveSubdomains.length})`}>
          {liveSubdomains.length === 0 ? (
            <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
              No subdomains active
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
              }}
            >
              {liveSubdomains.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 13,
                    color: "#60a5fa",
                    textDecoration: "none",
                    padding: "4px 0",
                  }}
                >
                  {s.name}
                </a>
              ))}
            </div>
          )}
        </Card>

        {/* Buried — ready to introdote */}
        <Card title={`Buried — ready to ship (${buried.length})`}>
          {buried.length === 0 ? (
            <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
              Nothing buried — everything is shipped!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {buried.map((p) => (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "4px 0",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "#aaa" }}>{p.name}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#555",
                      fontFamily: "monospace",
                    }}
                  >
                    {p.framework}
                    {p.hasBuild ? " (built)" : ""}
                  </span>
                </div>
              ))}
              {buried.length < 24 && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#444",
                    marginTop: 4,
                  }}
                >
                  +{24 - buried.length} more in ~/code/ and ~/Desktop/appaday
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Connected Services */}
        <Card title={`Services (${providers.length})`}>
          {providers.length === 0 ? (
            <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
              No services connected
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {providers.map((p) => (
                <div
                  key={p.name}
                  style={{
                    padding: 12,
                    background: "#12121f",
                    borderRadius: 8,
                    border: "1px solid #2a2a4a",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <StatusBadge ok={p.status === "ok"} />
                      <strong style={{ fontSize: 15 }}>{p.name}</strong>
                      <span
                        style={{ color: "#666", marginLeft: 8, fontSize: 13 }}
                      >
                        {p.role}
                      </span>
                    </div>
                  </div>
                  {p.domains && p.domains.length > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        marginLeft: 16,
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      {p.domains.map((d) => (
                        <a
                          key={d.name}
                          href={`https://${d.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "#1a1a2e",
                            color: "#60a5fa",
                            border: "1px solid #2a2a4a",
                            textDecoration: "none",
                          }}
                        >
                          {d.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <footer
        style={{
          marginTop: 40,
          paddingTop: 20,
          borderTop: "1px solid #2a2a4a",
          color: "#555",
          fontSize: 12,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          Introdote — your projects don't stay buried
        </span>
        <a
          href="https://github.com/st-patrick/introdote"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#555", textDecoration: "none" }}
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}

const rootStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: 32,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: "#e0e0e0",
  background: "#0f0f1a",
  minHeight: "100vh",
};

export default App;

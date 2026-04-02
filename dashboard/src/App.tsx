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

interface Project {
  name: string;
  path: string;
  type?: string;
  framework?: string;
  deploy?: { provider: string; projectId?: string };
  envFiles?: string[];
}

interface DevDeploy {
  project: string;
  subdomain: string;
  deployed_at: string;
  source: string;
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

// Map a provider's credential_keys to the secrets data to show keys under each service
function getProviderKeys(
  provider: Provider,
  secrets: SecretsData
): Array<{ key: string; redacted: string; exists: boolean }> {
  // If the provider has explicit credential_keys, use those
  if (provider.credential_keys && provider.credential_keys.length > 0) {
    return provider.credential_keys.map((k) => ({
      key: k,
      redacted: secrets[k]?.redacted || "not set",
      exists: secrets[k]?.exists || false,
    }));
  }
  // Otherwise try to match secrets by provider name prefix
  const prefix = provider.name.toUpperCase().replace(/[^A-Z]/g, "");
  const matched = Object.keys(secrets).filter(
    (k) =>
      k.toUpperCase().startsWith(prefix) ||
      k.toUpperCase().includes(prefix.slice(0, 4))
  );
  return matched.map((k) => ({
    key: k,
    redacted: secrets[k].redacted,
    exists: secrets[k].exists,
  }));
}

function App() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [devDeploys, setDevDeploys] = useState<DevDeploy[]>([]);
  const [secrets, setSecrets] = useState<SecretsData>({});
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/status`).then((r) => r.json()),
      fetch(`${API}/providers`).then((r) => r.json()),
      fetch(`${API}/projects`).then((r) => r.json()),
      fetch(`${API}/dev-deploys`).then((r) => r.json()),
      fetch(`${API}/secrets`).then((r) => r.json()),
      fetch(`${API}/capabilities`).then((r) => r.json()),
    ])
      .then(([s, prov, proj, dev, sec, cap]) => {
        setStatus(s);
        setProviders(prov);
        setProjects(proj);
        setDevDeploys(dev.deploys || []);
        setSecrets(sec);
        setCapabilities(cap);
      })
      .catch(() => {
        setError(
          "Can't reach the API server. Run: npx tsx server.ts (in the dashboard/ directory)"
        );
      });
  }, []);

  if (error) {
    return (
      <div style={rootStyle}>
        <h1 style={{ fontSize: 24, margin: "0 0 16px 0" }}>Open Your Eyes</h1>
        <div
          style={{
            background: "#2a1a1a",
            border: "1px solid #ef4444",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <p style={{ margin: 0, color: "#ef4444" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div style={rootStyle}>
        <p style={{ color: "#888" }}>Loading...</p>
      </div>
    );
  }

  const deployedProjects = projects.filter((p) => p.deploy);
  const undeployedProjects = projects.filter((p) => !p.deploy);

  // Extract domains from capabilities
  const caps = capabilities?.capabilities as Record<string, Record<string, unknown>> | undefined;
  const allDomains: Array<{
    name: string;
    registrar: string;
    pointing_at?: string;
    expires?: string;
    auto_renew?: boolean;
  }> = [];
  if (caps?.domain_registration) {
    const domains = (caps.domain_registration as Record<string, unknown>).domains as Array<Record<string, unknown>> | undefined;
    if (domains) {
      for (const d of domains) {
        allDomains.push({
          name: String(d.name || ""),
          registrar: String((caps.domain_registration as Record<string, unknown>).provider || ""),
          pointing_at: d.pointing_at ? String(d.pointing_at) : undefined,
          expires: d.expires ? String(d.expires) : undefined,
          auto_renew: d.auto_renew as boolean | undefined,
        });
      }
    }
  }

  return (
    <div style={rootStyle}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, margin: "0 0 4px 0", fontWeight: 700 }}>
          Open Your Eyes
        </h1>
        <p style={{ margin: 0, color: "#888", fontSize: 14 }}>
          {status.installed
            ? `Reading from ${status.oye_dir}`
            : "Not installed yet — run install.sh"}
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: 20,
        }}
      >
        {/* Connected Services (merged with API Keys) */}
        <Card title="Connected Services">
          {providers.length === 0 && !capabilities?.configured ? (
            <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
              No services connected yet. Tell your agent: "open your eyes"
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {providers.map((p) => {
                const keys = getProviderKeys(p, secrets);
                return (
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
                        marginBottom: keys.length > 0 ? 8 : 0,
                      }}
                    >
                      <div>
                        <StatusBadge ok={p.status === "ok"} />
                        <strong style={{ fontSize: 15 }}>{p.name}</strong>
                        <span style={{ color: "#666", marginLeft: 8, fontSize: 13 }}>
                          {p.role}
                        </span>
                      </div>
                      <span style={{ color: "#555", fontSize: 12 }}>
                        {p.account || ""}
                      </span>
                    </div>
                    {keys.length > 0 && (
                      <div style={{ marginLeft: 16 }}>
                        {keys.map((k) => (
                          <div
                            key={k.key}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "2px 0",
                              fontSize: 12,
                            }}
                          >
                            <code style={{ color: "#888" }}>{k.key}</code>
                            <code style={{ color: k.exists ? "#555" : "#ef4444" }}>
                              {k.redacted}
                            </code>
                          </div>
                        ))}
                      </div>
                    )}
                    {p.validated_at && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#444",
                          marginTop: 4,
                          marginLeft: 16,
                        }}
                      >
                        Validated: {new Date(p.validated_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Domains */}
        <Card title={`Domains (${allDomains.length})`}>
          {allDomains.length === 0 ? (
            <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
              No domains configured yet
            </p>
          ) : (
            <table style={tableStyle}>
              <tbody>
                {allDomains.map((d) => (
                  <tr key={d.name}>
                    <td>
                      <StatusBadge ok={true} />
                      <strong>{d.name}</strong>
                    </td>
                    <td style={{ color: "#888", fontSize: 13 }}>{d.registrar}</td>
                    <td style={{ color: "#888", fontSize: 13, textAlign: "right" }}>
                      {d.pointing_at && (
                        <span>
                          &rarr; {d.pointing_at}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {allDomains
                  .filter((d) => d.expires)
                  .map((d) => (
                    <tr key={d.name + "-expiry"}>
                      <td colSpan={3} style={{ fontSize: 12, color: "#555", paddingLeft: 16 }}>
                        Expires: {d.expires}
                        {d.auto_renew === false && (
                          <span style={{ color: "#f59e0b", marginLeft: 8 }}>
                            auto-renew off
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* System Status */}
        <Card title="System">
          <table style={tableStyle}>
            <tbody>
              {Object.entries(status.files).map(([file, exists]) => (
                <tr key={file}>
                  <td>
                    <StatusBadge ok={exists} />
                    <code style={{ fontSize: 13 }}>{file}</code>
                  </td>
                  <td
                    style={{
                      color: exists ? "#22c55e" : "#ef4444",
                      textAlign: "right",
                    }}
                  >
                    {exists ? "ready" : "missing"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Deployed Projects */}
        <Card title={`Deployed Projects (${deployedProjects.length})`}>
          {deployedProjects.length === 0 ? (
            <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
              No projects deployed yet
            </p>
          ) : (
            <table style={tableStyle}>
              <tbody>
                {deployedProjects.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <StatusBadge ok={true} />
                      <strong>{p.name}</strong>
                    </td>
                    <td style={{ color: "#888" }}>
                      {p.framework || p.type || ""}
                    </td>
                    <td style={{ color: "#888", textAlign: "right" }}>
                      {p.deploy?.provider}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Local Projects */}
        <Card title={`Local Projects (${undeployedProjects.length})`}>
          {undeployedProjects.length === 0 ? (
            <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
              All projects are deployed
            </p>
          ) : (
            <table style={tableStyle}>
              <tbody>
                {undeployedProjects.slice(0, 15).map((p) => (
                  <tr key={p.name}>
                    <td>
                      <span style={{ color: "#555", marginRight: 8 }}>
                        --
                      </span>
                      {p.name}
                    </td>
                    <td style={{ color: "#888", textAlign: "right" }}>
                      {p.framework || p.type || ""}
                    </td>
                  </tr>
                ))}
                {undeployedProjects.length > 15 && (
                  <tr>
                    <td colSpan={2} style={{ color: "#555", fontSize: 13 }}>
                      +{undeployedProjects.length - 15} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </Card>

        {/* Dev Previews */}
        <Card title={`Dev Previews (${devDeploys.length})`}>
          {devDeploys.length === 0 ? (
            <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
              No dev previews active. Tell your agent: "preview this"
            </p>
          ) : (
            <table style={tableStyle}>
              <tbody>
                {devDeploys.map((d) => (
                  <tr key={d.project}>
                    <td>
                      <StatusBadge ok={true} />
                      <a
                        href={`https://${d.subdomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#60a5fa", textDecoration: "none" }}
                      >
                        {d.subdomain}
                      </a>
                    </td>
                    <td
                      style={{
                        color: "#888",
                        textAlign: "right",
                        fontSize: 12,
                      }}
                    >
                      {new Date(d.deployed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        }}
      >
        Open Your Eyes — say "finish" to ship, "preview this" for dev
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

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

export default App;

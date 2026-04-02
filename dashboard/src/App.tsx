import { useEffect, useState } from "react";

const API = "/api";

interface Provider {
  name: string;
  role: string;
  account?: string;
  status?: string;
  validated_at?: string;
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

  const secretKeys = Object.keys(secrets);
  const deployedProjects = projects.filter((p) => p.deploy);
  const undeployedProjects = projects.filter((p) => !p.deploy);

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
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
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
                  <td style={{ color: exists ? "#22c55e" : "#ef4444", textAlign: "right" }}>
                    {exists ? "ready" : "missing"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Connected Services */}
        <Card title="Connected Services">
          {providers.length === 0 && !capabilities?.configured ? (
            <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
              No services connected yet. Tell your agent: "open your eyes"
            </p>
          ) : (
            <table style={tableStyle}>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <StatusBadge ok={p.status === "ok"} />
                      <strong>{p.name}</strong>
                    </td>
                    <td style={{ color: "#888" }}>{p.role}</td>
                    <td style={{ color: "#888", textAlign: "right" }}>
                      {p.account || ""}
                    </td>
                  </tr>
                ))}
                {providers.length === 0 && capabilities?.configured && (
                  <tr>
                    <td colSpan={3} style={{ color: "#888", fontSize: 14 }}>
                      Capabilities configured but no provider files yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </Card>

        {/* API Keys */}
        <Card title={`API Keys (${secretKeys.length})`}>
          {secretKeys.length === 0 ? (
            <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
              No keys stored yet
            </p>
          ) : (
            <table style={tableStyle}>
              <tbody>
                {secretKeys.map((key) => (
                  <tr key={key}>
                    <td>
                      <StatusBadge ok={secrets[key].exists} />
                      <code style={{ fontSize: 12 }}>{key}</code>
                    </td>
                    <td
                      style={{
                        color: "#555",
                        fontFamily: "monospace",
                        fontSize: 12,
                        textAlign: "right",
                      }}
                    >
                      {secrets[key].redacted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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

        {/* Undeployed Projects */}
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
                      <span style={{ color: "#555", marginRight: 8 }}>--</span>
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
                    <td style={{ color: "#888", textAlign: "right", fontSize: 12 }}>
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

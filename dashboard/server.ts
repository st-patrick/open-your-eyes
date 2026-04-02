import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { parse as parseYaml } from "yaml";

const app = express();
app.use(cors());
app.use(express.json());

const OYE_DIR = path.join(process.env.HOME || "~", ".open-your-eyes");

// Read a file from ~/.open-your-eyes/, return null if missing
function readOyeFile(filename: string): string | null {
  const filepath = path.join(OYE_DIR, filename);
  try {
    return fs.readFileSync(filepath, "utf-8");
  } catch {
    return null;
  }
}

// Parse secrets.env into key-value pairs (values redacted)
function parseSecretsEnv(): Record<string, { exists: boolean; redacted: string }> {
  const content = readOyeFile("secrets.env");
  if (!content) return {};
  const result: Record<string, { exists: boolean; redacted: string }> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    result[key] = {
      exists: value.length > 0,
      redacted: value.length > 4
        ? value.slice(0, 3) + "..." + value.slice(-3)
        : "***",
    };
  }
  return result;
}

// GET /api/status — overall system status
app.get("/api/status", (_req, res) => {
  const exists = fs.existsSync(OYE_DIR);
  const hasSecrets = fs.existsSync(path.join(OYE_DIR, "secrets.env"));
  const hasCapabilities = fs.existsSync(path.join(OYE_DIR, "capabilities.yaml"));
  const hasPlaybook = fs.existsSync(path.join(OYE_DIR, "PLAYBOOK.md"));

  res.json({
    installed: exists,
    oye_dir: OYE_DIR,
    files: {
      "secrets.env": hasSecrets,
      "capabilities.yaml": hasCapabilities,
      "PLAYBOOK.md": hasPlaybook,
    },
  });
});

// GET /api/capabilities — what the agent can do
app.get("/api/capabilities", (_req, res) => {
  const content = readOyeFile("capabilities.yaml");
  if (!content) return res.json({ configured: false, capabilities: {} });
  try {
    const capabilities = parseYaml(content) || {};
    res.json({ configured: true, capabilities });
  } catch {
    res.json({ configured: false, capabilities: {}, error: "Failed to parse capabilities.yaml" });
  }
});

// GET /api/secrets — list of configured keys (redacted)
app.get("/api/secrets", (_req, res) => {
  res.json(parseSecretsEnv());
});

// GET /api/providers — list all provider files
app.get("/api/providers", (_req, res) => {
  const providersDir = path.join(OYE_DIR, "providers");
  if (!fs.existsSync(providersDir)) return res.json([]);

  const files = fs.readdirSync(providersDir).filter((f) => f.endsWith(".yaml"));
  const providers = files.map((f) => {
    try {
      const content = fs.readFileSync(path.join(providersDir, f), "utf-8");
      return parseYaml(content);
    } catch {
      return { name: f.replace(".yaml", ""), error: "Failed to parse" };
    }
  });
  res.json(providers);
});

// GET /api/dev-deploys — active dev preview deployments
app.get("/api/dev-deploys", (_req, res) => {
  const content = readOyeFile("dev-deploys.yaml");
  if (!content) return res.json({ deploys: [] });
  try {
    const data = parseYaml(content) || {};
    res.json(data);
  } catch {
    res.json({ deploys: [], error: "Failed to parse dev-deploys.yaml" });
  }
});

// GET /api/projects — scan ~/code/ for projects and match with capabilities
app.get("/api/projects", (_req, res) => {
  const codeDir = path.join(process.env.HOME || "~", "code");
  if (!fs.existsSync(codeDir)) return res.json([]);

  const entries = fs.readdirSync(codeDir, { withFileTypes: true });
  const projects = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => {
      const projectPath = path.join(codeDir, e.name);
      const info: Record<string, unknown> = {
        name: e.name,
        path: projectPath,
      };

      // Detect project type
      if (fs.existsSync(path.join(projectPath, "package.json"))) {
        try {
          const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, "package.json"), "utf-8"));
          info.type = "node";
          const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
          if (allDeps["next"]) info.framework = "next";
          else if (allDeps["react"]) info.framework = "react";
          else if (allDeps["vue"]) info.framework = "vue";
          else if (allDeps["svelte"]) info.framework = "svelte";
          else if (allDeps["astro"]) info.framework = "astro";
        } catch { /* ignore */ }
      }
      if (fs.existsSync(path.join(projectPath, "pubspec.yaml"))) info.type = "flutter";
      if (fs.existsSync(path.join(projectPath, "Cargo.toml"))) info.type = "rust";
      if (fs.existsSync(path.join(projectPath, "go.mod"))) info.type = "go";

      // Check deploy targets
      if (fs.existsSync(path.join(projectPath, ".vercel", "project.json"))) {
        try {
          const vercel = JSON.parse(
            fs.readFileSync(path.join(projectPath, ".vercel", "project.json"), "utf-8")
          );
          info.deploy = { provider: "vercel", projectId: vercel.projectId };
        } catch { /* ignore */ }
      } else if (fs.existsSync(path.join(projectPath, "netlify.toml"))) {
        info.deploy = { provider: "netlify" };
      } else if (fs.existsSync(path.join(projectPath, "fly.toml"))) {
        info.deploy = { provider: "fly" };
      } else if (fs.existsSync(path.join(projectPath, "wrangler.toml"))) {
        info.deploy = { provider: "cloudflare" };
      }

      // Check for env files
      const envFiles = [".env", ".env.local", ".env.production"].filter((f) =>
        fs.existsSync(path.join(projectPath, f))
      );
      if (envFiles.length > 0) info.envFiles = envFiles;

      return info;
    });

  res.json(projects);
});

// GET /api/validation-log
app.get("/api/validation-log", (_req, res) => {
  const content = readOyeFile("validation-log.json");
  if (!content) return res.json({});
  try {
    res.json(JSON.parse(content));
  } catch {
    res.json({ error: "Failed to parse validation-log.json" });
  }
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Open Your Eyes dashboard API → http://localhost:${PORT}`);
  console.log(`Reading from: ${OYE_DIR}`);
});

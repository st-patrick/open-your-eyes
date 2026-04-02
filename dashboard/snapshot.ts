// Snapshots the current ~/.open-your-eyes/ state into a static JSON file
// so the deployed dashboard can show real data without a backend.

import fs from "fs";
import path from "path";
import { parse as parseYaml } from "yaml";

const OYE_DIR = path.join(process.env.HOME || "~", ".open-your-eyes");

function readFile(filepath: string): string | null {
  try {
    return fs.readFileSync(filepath, "utf-8");
  } catch {
    return null;
  }
}

function parseSecretsEnv(): Record<string, { exists: boolean; redacted: string }> {
  const content = readFile(path.join(OYE_DIR, "secrets.env"));
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
      redacted: value.length > 4 ? value.slice(0, 3) + "..." + value.slice(-3) : "***",
    };
  }
  return result;
}

// Build snapshot
const snapshot = {
  status: {
    installed: fs.existsSync(OYE_DIR),
    oye_dir: OYE_DIR,
    files: {
      "secrets.env": fs.existsSync(path.join(OYE_DIR, "secrets.env")),
      "capabilities.yaml": fs.existsSync(path.join(OYE_DIR, "capabilities.yaml")),
      "PLAYBOOK.md": fs.existsSync(path.join(OYE_DIR, "PLAYBOOK.md")),
    },
  },
  providers: (() => {
    const dir = path.join(OYE_DIR, "providers");
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith(".yaml"))
      .map((f) => {
        try {
          return parseYaml(fs.readFileSync(path.join(dir, f), "utf-8"));
        } catch {
          return { name: f.replace(".yaml", ""), error: "parse failed" };
        }
      });
  })(),
  secrets: parseSecretsEnv(),
  capabilities: (() => {
    const content = readFile(path.join(OYE_DIR, "capabilities.yaml"));
    if (!content) return { configured: false, capabilities: {} };
    try {
      return { configured: true, capabilities: parseYaml(content) || {} };
    } catch {
      return { configured: false, capabilities: {} };
    }
  })(),
  devDeploys: (() => {
    const content = readFile(path.join(OYE_DIR, "dev-deploys.yaml"));
    if (!content) return { deploys: [] };
    try {
      return parseYaml(content) || { deploys: [] };
    } catch {
      return { deploys: [] };
    }
  })(),
  projects: (() => {
    const codeDir = path.join(process.env.HOME || "~", "code");
    if (!fs.existsSync(codeDir)) return [];
    return fs.readdirSync(codeDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => {
        const projectPath = path.join(codeDir, e.name);
        const info: Record<string, unknown> = { name: e.name, path: projectPath };
        if (fs.existsSync(path.join(projectPath, "package.json"))) {
          try {
            const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, "package.json"), "utf-8"));
            info.type = "node";
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps["next"]) info.framework = "next";
            else if (deps["react"]) info.framework = "react";
            else if (deps["vue"]) info.framework = "vue";
            else if (deps["svelte"]) info.framework = "svelte";
            else if (deps["astro"]) info.framework = "astro";
          } catch { /* ignore */ }
        }
        if (fs.existsSync(path.join(projectPath, ".vercel", "project.json"))) {
          try {
            const v = JSON.parse(fs.readFileSync(path.join(projectPath, ".vercel", "project.json"), "utf-8"));
            info.deploy = { provider: "vercel", projectId: v.projectId };
          } catch { /* ignore */ }
        } else if (fs.existsSync(path.join(projectPath, "netlify.toml"))) {
          info.deploy = { provider: "netlify" };
        } else if (fs.existsSync(path.join(projectPath, "fly.toml"))) {
          info.deploy = { provider: "fly" };
        }
        return info;
      });
  })(),
  generated_at: new Date().toISOString(),
};

const outPath = path.join(import.meta.dirname, "public", "snapshot.json");
fs.mkdirSync(path.join(import.meta.dirname, "public"), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
console.log(`Snapshot written to ${outPath} (${Object.keys(snapshot.providers).length} providers, ${snapshot.projects.length} projects)`);

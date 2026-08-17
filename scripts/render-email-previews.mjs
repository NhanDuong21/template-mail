import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const templateRoot = path.join(root, "email", "vi");
const outputRoot = path.join(root, "email", ".preview", "vi");
const dataPath = path.join(root, "email", "preview-data", "vi.json");

const previewData = JSON.parse(await readFile(dataPath, "utf8"));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function valueFor(key, context) {
  return key.split(".").reduce((value, part) => value?.[part], context);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh"
  }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value));
}

function renderTemplate(source, context) {
  let output = source;

  output = output.replace(
    /{{#each\s+([A-Za-z0-9_.]+)}}([\s\S]*?)(?:{{else}}([\s\S]*?))?{{\/each}}/g,
    (_, key, itemBlock, emptyBlock = "") => {
      const items = valueFor(key, context);
      if (!Array.isArray(items) || items.length === 0) return emptyBlock;
      return items.map((item) => renderTemplate(itemBlock, { ...context, ...item })).join("");
    }
  );

  output = output.replace(
    /{{#if\s+([A-Za-z0-9_.]+)}}([\s\S]*?){{\/if}}/g,
    (_, key, block) => valueFor(key, context) ? renderTemplate(block, context) : ""
  );

  output = output.replace(
    /{{formatDateTime\s+([A-Za-z0-9_.]+)}}/g,
    (_, key) => escapeHtml(formatDateTime(valueFor(key, context)))
  );

  output = output.replace(
    /{{formatCurrency\s+([A-Za-z0-9_.]+)}}/g,
    (_, key) => escapeHtml(formatCurrency(valueFor(key, context)))
  );

  output = output.replace(/{{([A-Za-z0-9_.]+)}}/g, (_, key) => {
    const value = valueFor(key, context);
    return value === undefined || value === null ? `[[thiếu:${key}]]` : escapeHtml(value);
  });

  return output;
}

async function collectHtmlFiles(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(absolute, base));
    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(path.relative(base, absolute).replaceAll(path.sep, "/"));
    }
  }
  return files;
}

const templateFiles = await collectHtmlFiles(templateRoot);
for (const relativeFile of templateFiles) {
  const source = await readFile(path.join(templateRoot, relativeFile), "utf8");
  const context = {
    ...previewData.common,
    ...(previewData.templates[relativeFile] ?? {})
  };
  const rendered = renderTemplate(source, context);
  const unresolved = [...new Set(rendered.match(/{{[^}]+}}/g) ?? [])];
  const missing = [...new Set(rendered.match(/\[\[thiếu:[^\]]+\]\]/g) ?? [])];
  if (unresolved.length || missing.length) {
    throw new Error(`${relativeFile}: dữ liệu preview chưa đủ: ${[...unresolved, ...missing].join(", ")}`);
  }
  const outputPath = path.join(outputRoot, relativeFile);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, rendered, "utf8");
}

console.log(`Đã render ${templateFiles.length} template vào ${path.relative(root, outputRoot)}`);


const fs = require("fs");
const path = require("path");
const { createPresignedPutUrl } = require("../r2-presign.cjs");

const root = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
  }
}

function parseArgs(argv) {
  const args = {
    folder: path.join(root, "tiles"),
    prefix: "tiles",
    only: "",
    concurrency: 8,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--folder") args.folder = argv[++i];
    else if (arg === "--prefix") args.prefix = argv[++i];
    else if (arg === "--only") args.only = argv[++i];
    else if (arg === "--concurrency") args.concurrency = Number(argv[++i]) || 8;
    else if (arg === "--help" || arg === "-h") {
      console.log([
        "Uso:",
        "  node tools/upload-tiles-r2.cjs --folder .\\tiles --prefix tiles",
        "  node tools/upload-tiles-r2.cjs --only curitiba-prueba",
        "",
        "Opciones:",
        "  --folder  Carpeta local que contiene las carpetas de tiles.",
        "  --prefix  Prefijo/ruta base en Cloudflare R2.",
        "  --only    Sube solo una carpeta de tiles dentro de --folder.",
        "  --concurrency Cantidad de subidas simultaneas. Por defecto: 8.",
      ].join("\n"));
      process.exit(0);
    }
  }

  args.folder = path.resolve(root, args.folder);
  args.prefix = String(args.prefix || "").replace(/^\/+|\/+$/g, "");
  args.only = String(args.only || "").replace(/^\/+|\/+$/g, "");
  return args;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".txt") return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function getTileFolders(baseFolder, only) {
  if (only) {
    const selected = path.join(baseFolder, only);
    if (!fs.existsSync(selected)) throw new Error(`No existe la carpeta: ${selected}`);
    return [selected];
  }

  return fs.readdirSync(baseFolder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(baseFolder, entry.name))
    .filter((folder) => fs.existsSync(path.join(folder, "config.json")));
}

async function uploadFile(localPath, key) {
  const signed = createPresignedPutUrl({ key, expires: 900 });
  const body = fs.readFileSync(localPath);
  const response = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": getContentType(localPath) },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`R2 rechazo ${key}: ${response.status} ${text}`.trim());
  }

  return signed.publicUrl;
}

async function uploadFilesWithLimit(files, folder, prefix, folderName, concurrency) {
  let uploaded = 0;
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, files.length) }, async () => {
    while (nextIndex < files.length) {
      const index = nextIndex;
      nextIndex += 1;
      const file = files[index];
      const rel = path.relative(folder, file).split(path.sep).join("/");
      const key = `${prefix}/${folderName}/${rel}`.replace(/^\/+/, "");
      await uploadFile(file, key);
      uploaded += 1;
      if (uploaded % 50 === 0 || uploaded === files.length) {
        console.log(`  ${uploaded}/${files.length}`);
      }
    }
  });

  await Promise.all(workers);
}

async function main() {
  loadEnvFile(path.join(root, ".env.local"));
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(args.folder)) {
    throw new Error(`No existe la carpeta local de tiles: ${args.folder}`);
  }

  const tileFolders = getTileFolders(args.folder, args.only);
  if (!tileFolders.length) {
    throw new Error("No se encontraron carpetas de tiles con config.json.");
  }

  const report = [
    "# Rutas Cloudflare R2 para multires",
    "# Pega cada URL en Panorama avanzado > Carpeta o ruta base de tiles",
    "",
  ];

  for (const folder of tileFolders) {
    const folderName = path.basename(folder);
    const files = listFiles(folder);
    console.log(`\nSubiendo ${folderName} (${files.length} archivos)...`);

    await uploadFilesWithLimit(files, folder, args.prefix, folderName, args.concurrency);

    const publicBase = `${process.env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "")}/${args.prefix}/${encodeURIComponent(folderName)}`;
    report.push(`${folderName}: ${publicBase}`);
  }

  const reportPath = path.join(args.folder, "_rutas-r2-multires.txt");
  fs.writeFileSync(reportPath, `${report.join("\n")}\n`, "utf8");
  console.log("\nListo. Rutas R2 guardadas en:");
  console.log(reportPath);
  console.log("");
  console.log(report.join("\n"));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

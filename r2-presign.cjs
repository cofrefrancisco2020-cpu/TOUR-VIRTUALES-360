const crypto = require("crypto");

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest(encoding);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function encodeKey(key) {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function getSigningKey(secret, dateStamp, region, service) {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function getR2Env() {
  const clean = (value) => (typeof value === "string" ? value.trim() : value);
  const required = {
    accountId: clean(process.env.R2_ACCOUNT_ID),
    accessKeyId: clean(process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: clean(process.env.R2_SECRET_ACCESS_KEY),
    bucket: clean(process.env.R2_BUCKET),
    publicBaseUrl: clean(process.env.R2_PUBLIC_BASE_URL),
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return { ...required, missing };
}

function createPresignedUrl({ key, method = "PUT", expires = 900 }) {
  const env = getR2Env();
  if (env.missing.length) {
    const error = new Error(`Faltan variables R2: ${env.missing.join(", ")}`);
    error.statusCode = 501;
    throw error;
  }

  const region = "auto";
  const service = "s3";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = `${env.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${env.bucket}/${encodeKey(key)}`;
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${env.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expires),
    "X-Amz-SignedHeaders": "host",
  });

  const canonicalQueryString = [...query.entries()]
    .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
    .sort()
    .join("&");
  const canonicalHeaders = `host:${host}\n`;
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");
  const signature = hmac(getSigningKey(env.secretAccessKey, dateStamp, region, service), stringToSign, "hex");
  query.set("X-Amz-Signature", signature);

  const publicBase = env.publicBaseUrl.replace(/\/+$/, "");
  return {
    url: `https://${host}${canonicalUri}?${query.toString()}`,
    publicUrl: `${publicBase}/${encodeKey(key)}`,
    key,
  };
}

function createPresignedPutUrl({ key, expires = 900 }) {
  const signed = createPresignedUrl({ key, method: "PUT", expires });
  return {
    uploadUrl: signed.url,
    publicUrl: signed.publicUrl,
    key: signed.key,
  };
}

function createPresignedDeleteUrl({ key, expires = 900 }) {
  const signed = createPresignedUrl({ key, method: "DELETE", expires });
  return {
    deleteUrl: signed.url,
    key: signed.key,
  };
}

async function deleteR2Object(key) {
  const signed = createPresignedDeleteUrl({ key });
  const response = await fetch(signed.deleteUrl, { method: "DELETE" });
  if (!response.ok) {
    const error = new Error(`R2 rechazo la eliminacion (${response.status}).`);
    error.statusCode = response.status;
    throw error;
  }
  return { key };
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleR2Presign(req, res) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const body = await readJsonBody(req);
    const keys = Array.isArray(body.keys) ? body.keys : null;
    if (keys) {
      const cleanKeys = keys.map((item) => String(item || "").replace(/^\/+/, ""));
      if (!cleanKeys.length || cleanKeys.some((key) => !key || key.includes(".."))) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Keys invalidas" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ uploads: cleanKeys.map((key) => createPresignedPutUrl({ key })) }));
      return;
    }

    const key = String(body.key || "").replace(/^\/+/, "");
    if (!key || key.includes("..")) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Key invalida" }));
      return;
    }

    const signed = createPresignedPutUrl({ key });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(signed));
  } catch (error) {
    res.writeHead(error.statusCode || 500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message || "No se pudo firmar la subida R2" }));
  }
}

async function handleR2Delete(req, res) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const body = await readJsonBody(req);
    const key = String(body.key || "").replace(/^\/+/, "");
    if (!key || key.includes("..")) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Key invalida" }));
      return;
    }

    const deleted = await deleteR2Object(key);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(deleted));
  } catch (error) {
    res.writeHead(error.statusCode || 500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message || "No se pudo eliminar el archivo R2" }));
  }
}

module.exports = { createPresignedPutUrl, createPresignedDeleteUrl, deleteR2Object, handleR2Presign, handleR2Delete };

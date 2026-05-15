import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const r2 = new S3Client({
  region: "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_URL = process.env.R2_PUBLIC_URL;

// Only betting house logos - social media icons are kept in /public
const logos = [
  "betano.png",
  "betfair.png",
  "betnacional.png",
  "esportivabet.png",
  "estrelabet.png",
  "novibet.png",
  "segurobet.png",
  "stake.png",
  "superbet.png",
  "uaffiliated.png",
  "uaffiliatedwide.png",
];

async function uploadLogo(filename) {
  const filePath = path.join(__dirname, "..", "public", filename);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filename}`);
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath);
    const fileExtension = path.extname(filename);
    const mimeType =
      fileExtension === ".svg" ? "image/svg+xml" : "image/png";

    console.log(`Uploading ${filename} to bucket: ${BUCKET_NAME}...`);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: new Uint8Array(fileContent),
      ContentType: mimeType,
    });

    await r2.send(command);

    const url = `${R2_URL}/${filename}`;
    console.log(`✅ Uploaded ${filename} → ${url}`);
    return url;
  } catch (error) {
    console.error(`❌ Error uploading ${filename}:`, error);
    return null;
  }
}

async function main() {
  console.log("🚀 Uploading predefined logos to R2...\n");

  const results = {};

  for (const logo of logos) {
    const url = await uploadLogo(logo);
    if (url) {
      const nameWithoutExt = logo.replace(".png", "");
      results[nameWithoutExt] = url;
    }
  }

  console.log("\n📊 Upload Summary:");
  console.log(JSON.stringify(results, null, 2));

  console.log(
    "\n✨ Now update lib/houseThemes.ts with these URLs if needed"
  );
}

main().catch(console.error);

import { promises as fs } from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const HOUSE_LOGOS: Record<string, string> = {
  Betano: "betano.png",
  Betfair: "betfair.png",
  "Bet Nacional": "betnacional.png",
  Esportivabet: "esportivabet.png",
  Estrelabet: "estrelabet.png",
  Novibet: "novibet.png",
  Segurobet: "segurobet.png",
  Stake: "stake.png",
  Superbet: "superbet.png",
};

async function uploadHouseLogos() {
  try {
    console.log("🚀 Starting house logo upload to R2...");

    for (const [houseName, fileName] of Object.entries(HOUSE_LOGOS)) {
      const filePath = path.join(process.cwd(), "public", fileName);

      try {
        const fileBuffer = await fs.readFile(filePath);
        const ext = path.extname(fileName);
        const r2FileName = `houses/${houseName.toLowerCase().replace(/\s+/g, "-")}${ext}`;

        console.log(`📤 Uploading ${houseName} (${fileName})...`);

        await r2.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: r2FileName,
            Body: fileBuffer,
            ContentType: "image/png",
          })
        );

        const logoUrl = `${process.env.R2_PUBLIC_URL}/${r2FileName}`;

        // Update house record with logo URL
        const updated = await prisma.house.update({
          where: { name: houseName },
          data: { logoUrl },
        });

        console.log(`✅ ${houseName} - ${logoUrl}`);
      } catch (err) {
        console.error(`❌ Error uploading ${houseName}:`, err);
      }
    }

    console.log("\n✨ House logos uploaded successfully!");
  } catch (err) {
    console.error("❌ Upload failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

uploadHouseLogos();

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { verifyToken } from "@/lib/auth";
import { r2 } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Arquivo deve ser uma imagem" }, { status: 400 });
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo muito grande (máx 2MB)" }, { status: 400 });
    }

    // Buscar logo anterior para deletar
    const previousSettings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });

    // Deletar arquivo anterior do R2 se existir
    if (previousSettings?.logoUrl) {
      try {
        const previousFilename = previousSettings.logoUrl.split("/").pop();
        if (previousFilename) {
          await r2.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME!,
              Key: previousFilename,
            })
          );
        }
      } catch (err) {
        console.error("Error deleting previous logo:", err);
      }
    }

    // Gerar nome único
    const ext = file.name.split(".").pop() || "png";
    const filename = `logo-${Date.now()}.${ext}`;

    // Converter para Buffer
    const buffer = await file.arrayBuffer();

    // Upload para R2
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: filename,
        Body: new Uint8Array(buffer),
        ContentType: file.type,
      })
    );

    // Construir URL pública
    const logoUrl = `${process.env.R2_PUBLIC_URL}/${filename}`;

    // Salvar no banco
    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", logoUrl },
      update: { logoUrl },
    });

    return NextResponse.json({ logoUrl, message: "Logo atualizado com sucesso" });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload da logo" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function extractReferralCodeFromUrl(input: string): string {
  try {
    // If input starts with http:// or https://, parse as full URL
    if (input.startsWith("http://") || input.startsWith("https://")) {
      const url = new URL(input);
      return url.searchParams.get("ref") || input;
    }
    // If input starts with ?, parse as query string
    if (input.startsWith("?")) {
      const url = new URL(`http://example.com${input}`);
      return url.searchParams.get("ref") || input;
    }
    // Otherwise treat as plain referral code (user ID)
    return input;
  } catch {
    // If parsing fails, return input as-is
    return input;
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { referralCode } = await request.json();

    if (!referralCode || typeof referralCode !== "string") {
      return NextResponse.json(
        { error: "Código de indicação é obrigatório" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { affiliateParentId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (user.affiliateParentId) {
      return NextResponse.json(
        { error: "Você já está vinculado a um indicador" },
        { status: 409 }
      );
    }

    const extractedCode = extractReferralCodeFromUrl(referralCode);

    if (extractedCode === decoded.id) {
      return NextResponse.json(
        { error: "Você não pode se vincular a si mesmo" },
        { status: 400 }
      );
    }

    const referrer = await prisma.user.findUnique({
      where: { id: extractedCode },
      select: { id: true },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "Indicador não encontrado" },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: decoded.id },
      data: { affiliateParentId: referrer.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao vincular indicação" },
      { status: 500 }
    );
  }
}

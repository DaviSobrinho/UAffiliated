import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log("[LOGIN] 🔐 Iniciando login...");

    const { email, password } = await request.json();
    console.log(`[LOGIN] Email: ${email}`);

    if (!email || !password) {
      console.log("[LOGIN] ❌ E-mail ou senha ausentes");
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    console.log("[LOGIN] 🔍 Buscando usuário no banco...");
    const queryStart = Date.now();
    const user = await prisma.user.findUnique({
      where: { email },
    });
    console.log(`[LOGIN] ✓ Query de usuário em ${Date.now() - queryStart}ms`);

    if (!user) {
      console.log("[LOGIN] ❌ Usuário não encontrado");
      return NextResponse.json(
        { error: "E-mail ou senha inválidos" },
        { status: 401 }
      );
    }

    console.log(`[LOGIN] ✓ Usuário encontrado: ${user.name} (${user.role})`);
    console.log("[LOGIN] 🔐 Verificando senha...");

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      console.log("[LOGIN] ❌ Senha inválida");
      return NextResponse.json(
        { error: "E-mail ou senha inválidos" },
        { status: 401 }
      );
    }

    console.log("[LOGIN] ✓ Senha validada");
    console.log("[LOGIN] 🎫 Gerando token...");

    const token = generateToken(user.id, user.email, user.role);

    const response = NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );

    response.cookies.set("auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    const duration = Date.now() - startTime;
    console.log(`[LOGIN] ✅ Login bem-sucedido em ${duration}ms`);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[LOGIN] 💥 ERRO após ${duration}ms:`, error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

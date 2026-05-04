import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashPassword, generateToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, confirmPassword, instagram, phone, market, ftdsPerMonth, referralCode } =
      await request.json();

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "As senhas não conferem" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "E-mail já está em uso" },
        { status: 409 }
      );
    }

    let affiliateParentId: string | undefined;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { id: referralCode },
      });
      if (referrer) {
        affiliateParentId = referrer.id;
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        instagram,
        phone,
        market,
        ftdsPerMonth,
        role: "USER",
        affiliateParentId,
      },
    });

    const token = generateToken(user.id, user.email);

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
      { status: 201 }
    );

    response.cookies.set("auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

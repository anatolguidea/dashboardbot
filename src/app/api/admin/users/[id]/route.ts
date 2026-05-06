import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const user = session?.user as SessionUser | undefined
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params;
  const { email, password, company_name, db_name } = await request.json();

  try {
    const updateData: Record<string, string | null> = {};
    if (email) updateData.email = email;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (company_name !== undefined) updateData.company_name = company_name;
    if (db_name !== undefined) updateData.db_name = db_name;

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    const { password: _p, ...userWithoutPassword } = user;
    void _p;
    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const user = session?.user as SessionUser | undefined
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params;

  try {
    await prisma.user.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


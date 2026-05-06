import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { user_id, name, sheet_url } = await request.json();

    if (!user_id || !name || !sheet_url) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const channel = await prisma.channel.create({
      data: {
        userId: user_id,
        name,
        sheet_url
      }
    });

    return NextResponse.json({ success: true, channel });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

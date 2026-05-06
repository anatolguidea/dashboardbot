import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as SessionUser | undefined
  
  if (!user || !user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const channels = await prisma.channel.findMany({
      where: {
        userId: user.id
      }
    });

    return NextResponse.json(channels);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"

interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as SessionUser | undefined
  
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        channels: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password: _password, ...rest } = user
      return rest
    })

    return NextResponse.json(usersWithoutPasswords)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userSession = session?.user as SessionUser | undefined
  
  if (!userSession || userSession.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, password, company_name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user in local DB
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        company_name: company_name || '',
        role: 'client' // Admin creates clients
      }
    })

    const { password: _password, ...userWithoutPassword } = user
    return NextResponse.json({ message: 'User created successfully', user: userWithoutPassword })
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

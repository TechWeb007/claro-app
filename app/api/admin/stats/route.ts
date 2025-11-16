export const dynamic = "force-dynamic";
export const runtime = "nodejs"; 

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Global stats
    const [totalCompanies, totalConversations, totalQuotes] = await Promise.all([
      prisma.company.count(),
      prisma.conversation.count(),
      prisma.quote.count(),
    ])

    // Latest companies (with quote count)
    const latestCompanies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: { quotes: true },
        },
      },
    })

    return NextResponse.json({
      totalCompanies,
      totalConversations,
      totalQuotes,
      latestCompanies,
    })
  } catch (error) {
    console.error('Error loading admin stats:', error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}

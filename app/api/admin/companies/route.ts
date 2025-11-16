export const dynamic = "force-dynamic";
export const runtime = "nodejs"; 

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { quotes: true } }, // Add total quotes per company
      },
    })

    return NextResponse.json(companies)
  } catch (err) {
    console.error('Error fetching companies:', err)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, domain } = await req.json()

    if (!name || !email || !domain) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Check if domain already exists
    const existing = await prisma.company.findUnique({ where: { domain } })
    if (existing) {
      return NextResponse.json({ error: 'Domain already exists' }, { status: 409 })
    }

    const newCompany = await prisma.company.create({
      data: { name, email, domain },
    })

    return NextResponse.json(newCompany)
  } catch (err) {
    console.error('Error creating company:', err)
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}

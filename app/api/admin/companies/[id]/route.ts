export const dynamic = "force-dynamic";
export const runtime = "nodejs"; 

import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET a single company + quotes + device issues
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const { id } = params

  if (!id) {
    return NextResponse.json({ error: "Missing company id" }, { status: 400 })
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        quotes: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const issues = await prisma.deviceIssueStat.findMany({
      where: { companyId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ company, issues })
  } catch (error) {
    console.error("Error fetching company details:", error)
    return NextResponse.json(
      { error: "Failed to fetch company details" },
      { status: 500 }
    )
  }
}

// UPDATE company
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const { id } = params

  if (!id) {
    return NextResponse.json({ error: "Missing company id" }, { status: 400 })
  }

  const data = await request.json()

  try {
    const updated = await prisma.company.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating company:", error)
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    )
  }
}

// DELETE company
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const { id } = params

  if (!id) {
    return NextResponse.json({ error: "Missing company id" }, { status: 400 })
  }

  try {
    await prisma.company.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting company:", error)
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; 

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import crypto from "crypto"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, domain } = body

    // 1️⃣ Validate input
    if (!name || !email || !domain) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 2️⃣ Check if a company already exists with this domain
    const existing = await prisma.company.findUnique({
      where: { domain },
    })

    if (existing) {
      return NextResponse.json(
        { error: "A company with this domain already exists" },
        { status: 400 }
      )
    }

    // 3️⃣ Generate a secure random API key
    const apiKey = crypto.randomBytes(24).toString("hex")

    // 4️⃣ Create company record (fields left empty for pricingInfo, aiPrompt, quoteTemplate)
    const newCompany = await prisma.company.create({
      data: {
        name,
        email,
        domain,
        apiKey,
        pricingInfo: null,
        aiPrompt: null,
        quoteTemplate: null,
      },
    })

    // 5️⃣ Return confirmation
    return NextResponse.json({
      success: true,
      message: "Company registered successfully",
      company: {
        id: newCompany.id,
        name: newCompany.name,
        domain: newCompany.domain,
        apiKey: newCompany.apiKey,
      },
    })
  } catch (error) {
    console.error("Company registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

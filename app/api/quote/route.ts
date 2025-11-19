export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import Handlebars from "handlebars"
import nodemailer from "nodemailer"
import "dotenv/config"

const prisma = new PrismaClient()

// EMAIL SENDER
async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST) {
    console.error("SMTP not configured")
    return
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  })

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    html,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, address, conversationId, domain } = body

    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversationId" },
        { status: 400 }
      )
    }

    if (!domain) {
      return NextResponse.json(
        { error: "Missing domain" },
        { status: 400 }
      )
    }

    // 1) Detect company by DOMAIN FROM BODY (not Origin header)
    const company = await prisma.company.findFirst({
      where: {
        OR: [
          {
            domain: {
              equals: domain,
              mode: "insensitive",
            },
          },
          {
            domain: {
              contains: domain,
              mode: "insensitive",
            },
          },
        ],
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: `Invalid company for domain ${domain}` },
        { status: 401 }
      )
    }

    // 2) Parse pricing info
    let pricing: any = {}
    try {
      pricing =
        typeof company.pricingInfo === "string"
          ? JSON.parse(company.pricingInfo)
          : company.pricingInfo
    } catch {
      pricing = {}
    }

    // 3) Get the CORRECT conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { summary: true },
    })

    let diagnostic: any = null
    if (conversation?.summary?.summary) {
      try {
        diagnostic = JSON.parse(conversation.summary.summary)
      } catch {
        diagnostic = null
      }
    }

    // 4) Region + travel fee
    const isMontreal = address?.toLowerCase().includes("montreal")
    const travelFee = isMontreal
      ? pricing?.travelFee?.montreal
      : pricing?.travelFee?.outside

    const travelLink = isMontreal
      ? pricing?.paymentLinks?.travelMontreal
      : pricing?.paymentLinks?.travelOutside

    // 5) Service rules
    const deviceType = diagnostic?.deviceType || "other"
    const serviceRule =
      pricing?.serviceRules?.[deviceType] || "onsite_or_dropoff"

    const dropOffAvailable =
      serviceRule === "dropoff" || serviceRule === "onsite_or_dropoff"
    const onsiteAvailable =
      serviceRule === "onsite" || serviceRule === "onsite_or_dropoff"
    const remoteAvailable = diagnostic?.serviceType === "remote"

    // 6) Create Quote record
    const quote = await prisma.quote.create({
      data: {
        companyId: company.id,
        name,
        email,
        phone,
        address,
        paymentLink: travelLink || "",
      },
    })

    // 7) Build response message using Handlebars
    let responseMessage = ""

    if (company.quoteTemplate && company.quoteTemplate.trim().length > 0) {
      const compileTemplate = Handlebars.compile(company.quoteTemplate, {
        noEscape: true,
      })

      responseMessage = compileTemplate({
        address: pricing?.address,
        hours: pricing?.hours,
        contactNumber: pricing?.contactNumber,
        dropOffFee: pricing?.dropOffFee,
        travelFee,
        travelLink,
        diagnosticFee: pricing?.diagnosticFee,
        hourlyRate: pricing?.hourlyRate?.regularPrinter,
        dropOffAvailable,
        onsiteAvailable,
        remoteAvailable,
      })

      responseMessage = responseMessage
        .replace(/(#+\s)/g, "\n\n$1")
        .replace(/\s{2,}/g, "  \n")
        .replace(/---/g, "\n\n---\n\n")
        .trim()
    } else {
      responseMessage =
        "Thank you for your request. A technician will contact you soon."
    }

    // 8) Save updated summary
    if (conversation?.id) {
      await prisma.conversationSummary.upsert({
        where: { conversationId: conversation.id },
        update: {
          summary: JSON.stringify({
            diagnostic,
            quoteMessage: responseMessage,
          }),
        },
        create: {
          conversationId: conversation.id,
          summary: JSON.stringify({
            diagnostic,
            quoteMessage: responseMessage,
          }),
        },
      })
    }

    // 9) Store quote message
    await prisma.quote.update({
      where: { id: quote.id },
      data: { quoteMessage: responseMessage },
    })

    // 10) Build email diagnostic summary
    let diagnosticSummary = "No diagnostic summary available."

    if (diagnostic) {
      const parts: string[] = []

      if (diagnostic.deviceBrand) parts.push(`Brand: ${diagnostic.deviceBrand}`)
      if (diagnostic.deviceModel) parts.push(`Model: ${diagnostic.deviceModel}`)
      if (diagnostic.deviceType && diagnostic.deviceType !== "other")
        parts.push(`Device type: ${diagnostic.deviceType}`)
      if (diagnostic.serviceType && diagnostic.serviceType !== "other")
        parts.push(`Service type: ${diagnostic.serviceType}`)
      if (diagnostic.problemDescription)
        parts.push(`Issue: ${diagnostic.problemDescription}`)

      diagnosticSummary = parts.length > 0 ? parts.join("\n") : diagnosticSummary
    }

    // 11) Email bodies
    const companyEmailBody = `
      <h2>New Quote Request</h2>
      <h3>Customer Information</h3>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone}</li>
        <li><strong>Address:</strong> ${address}</li>
      </ul>
      <h3>Diagnostic Summary</h3>
      <pre>${diagnosticSummary}</pre>
      <h3>Quote Message</h3>
      <p>${responseMessage}</p>
    `

    const customerEmailBody = `
      <h2>Thank you for your request!</h2>
      <p>Your request has been received by <strong>${company.name}</strong>.</p>
      <h3>Diagnostic Summary:</h3>
      <pre>${diagnosticSummary}</pre>
      <p>Once payment is completed, a technician will contact you.</p>
      ${
        travelLink
          ? `<p><a href="${travelLink}" target="_blank">Click here to pay the travel fee</a></p>`
          : ""
      }
    `

    // 12) Send emails
    await Promise.all([
      sendEmail(company.email, `New Quote from ${name}`, companyEmailBody),
      sendEmail(email, `Your ${company.name} Quote`, customerEmailBody),
    ])

    // 13) Return response
    return NextResponse.json({
      success: true,
      message: responseMessage,
      quoteId: quote.id,
    })
  } catch (error) {
    console.error("Quote API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

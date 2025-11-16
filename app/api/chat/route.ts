export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🔥 YOUR ORIGINAL PROMPT (unchanged)
const basePrompt = `
IMPORTANT — FOLLOW THESE RULES EXACTLY.

YOUR JOB:
- Ask a few short, focused questions (1–4) to understand the customer's situation: brand, model, issue, and basic context.
- For devices: confirm brand, model, what happens, when it happens, and (if needed) one clarifying detail (e.g. type/location of noise, any error message).
- For services (cleaning, moving, etc.): confirm what service they need and 1–3 key details (size, type of job, location).
- Do NOT ask long lists of questions and do NOT repeat yourself.
- As soon as you have enough info for a technician to prepare a quote, STOP asking questions.

THEN YOU MUST:
1) Send a short, natural summary message to the user.
2) Immediately after, output a diagnostic JSON block in this exact structure, wrapped in <diagnostic> ... </diagnostic>.
3) On the next line, output: <ready_for_quote>

FIELD RULES:
- If the user mentions a brand or model, ALWAYS fill deviceBrand and deviceModel (fix obvious typos if needed).
- Infer deviceType from context:
  - Printers → "laser_printer" or "inkjet_printer"
  - Computers / laptops → "computer" or "laptop"
  - Appliances → "appliance"
  - Cleaning services → "cleaning"
  - Moving services → "moving"
  - Otherwise → "other"
- Infer serviceType from intent:
  - Printer issues → "printer_repair"
  - IT / computer issues → "it_support"
  - Appliance issues → "appliance_repair"
  - Cleaning requests → "cleaning"
  - Moving / transport → "moving"
  - Otherwise → "other"
- problemDescription: clear human description of what is wrong and when it happens.
- location: fill if city, postal code, or address is mentioned, otherwise null.
- urgency: fill if the user says things like "urgent", "asap", "today", otherwise null.
- extraData: any useful structured details (error codes, type of cleaning, number of rooms, etc.) or {} if nothing special.
- If a field is unknown, set it to null.
- Do NOT invent details.
- NEVER wrap JSON in markdown.
- JSON must be valid.

<diagnostic>
{
  "serviceType": "printer_repair" | "it_support" | "appliance_repair" | "cleaning" | "moving" | "other",
  "deviceType": "laser_printer" | "inkjet_printer" | "computer" | "laptop" | "appliance" | "other",
  "deviceBrand": null,
  "deviceModel": null,
  "problemDescription": null,
  "location": null,
  "urgency": null,
  "extraData": {}
}
</diagnostic>
<ready_for_quote>
`;

export async function POST(req: Request) {
  try {
    // 🚀 FIX FOR VERCEL — USE DYNAMIC IMPORT (NO STATIC IMPORT ABOVE)
    const OpenAI = (await import("openai")).default;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });

    const body = await req.json();
    const { messages, domain, conversationId } = body;

    if (!domain) {
      return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    // 1) Fetch company by domain
    const company = await prisma.company.findFirst({
      where: { domain: { contains: domain, mode: "insensitive" } },
    });

    if (!company) {
      return NextResponse.json(
        { error: `No company found for domain: ${domain}` },
        { status: 404 }
      );
    }

    // 2) System prompt
    const systemPrompt = company.aiPrompt
      ? `${company.aiPrompt}\n\n${basePrompt}`
      : basePrompt;

    // 3) Ask OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    const aiMessage = completion.choices[0].message?.content || "";

    // 4) Save or update conversation
    let conversation;
    if (!conversationId) {
      conversation = await prisma.conversation.create({
        data: {
          companyId: company.id,
          messages: { messages },
        },
      });
    } else {
      conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: { messages: { messages } },
      });
    }

    // 5) Extract <diagnostic>
    const diagnosticMatch = aiMessage.match(
      /<diagnostic>([\s\S]*?)<\/diagnostic>/
    );

    let diagnosticData = null;

    if (diagnosticMatch) {
      try {
        diagnosticData = JSON.parse(diagnosticMatch[1]);

        // Save issue
        await prisma.deviceIssueStat.create({
          data: {
            companyId: company.id,
            conversationId: conversation.id,
            serviceType: diagnosticData.serviceType,
            deviceType: diagnosticData.deviceType,
            deviceBrand: diagnosticData.deviceBrand,
            deviceModel: diagnosticData.deviceModel,
            problemDescription: diagnosticData.problemDescription,
          },
        });

        // Save summary
        await prisma.conversationSummary.upsert({
          where: { conversationId: conversation.id },
          update: { summary: JSON.stringify(diagnosticData) },
          create: {
            conversationId: conversation.id,
            summary: JSON.stringify(diagnosticData),
          },
        });
      } catch (err) {
        console.error("Invalid diagnostic JSON:", err);
      }
    }

    // 6) Clean visible message
    const cleanReply = aiMessage
      .replace(/<diagnostic>[\s\S]*?<\/diagnostic>/, "")
      .replace("<ready_for_quote>", "")
      .trim();

    // 7) Response
    return NextResponse.json({
      reply: cleanReply,
      company: company.name,
      conversationId: conversation.id,
      diagnostic: diagnosticData,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

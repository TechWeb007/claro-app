import fs from "fs"
import path from "path"
import dotenv from "dotenv"

// Always load .env from project root
const envPath = path.join(process.cwd(), ".env")

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log("✅ Loaded .env from:", envPath)
} else {
  console.error("❌ .env file not found at:", envPath)
}

console.log("SMTP_HOST:", process.env.SMTP_HOST)

import nodemailer from "nodemailer"

async function testSMTP() {
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

  try {
    await transporter.verify()
    console.log("✅ SMTP connection successful. Ready to send mail.")
  } catch (err) {
    console.error("❌ SMTP connection failed:")
    console.error(err)
  }
}

testSMTP()

'use client'
import { useState } from 'react'

export default function RegisterCompany() {
  const [form, setForm] = useState({ name: '', email: '', domain: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const res = await fetch('/api/company/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)

    if (data.success) {
      setMessage(`✅ Company registered successfully! API key: ${data.company.apiKey}`)
    } else {
      setMessage(`❌ Error: ${data.error}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h1 className="text-lg font-semibold text-center">Register Company</h1>

        {['name', 'email', 'domain'].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {field}
            </label>
            <input
              type={field === 'email' ? 'email' : 'text'}
              className="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
              required
              value={(form as any)[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? 'Registering...' : 'Register Company'}
        </button>

        {message && <p className="text-sm text-center mt-2">{message}</p>}
      </form>
    </div>
  )
}

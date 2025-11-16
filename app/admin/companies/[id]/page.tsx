'use client'

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function CompanyDetailPage() {
  const router = useRouter()
  const params = useParams()

  // Extract id from params (works for string or array)
  const id =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : ''

  // Fetch company + issues
  const { data, error } = useSWR(
    id ? `/api/admin/companies/${id}` : null,
    fetcher
  )

  if (error)
    return (
      <div className="p-8 text-red-600">
        Failed to load company details.
      </div>
    )

  if (!data)
    return <div className="p-8 text-gray-500">Loading...</div>

  const { company, issues } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/companies')}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
          >
            ← Back to Companies
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            {company?.name}
          </h1>
        </div>
      </header>

      <main className="p-8 max-w-5xl mx-auto space-y-10">
        {/* Company Info */}
        <section className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-3">Company Information</h2>

          <div className="space-y-1 text-sm text-gray-700">
            <p>
              <span className="font-medium">Name:</span> {company?.name}
            </p>
            <p>
              <span className="font-medium">Email:</span> {company?.email}
            </p>
            <p>
              <span className="font-medium">Domain:</span> {company?.domain}
            </p>
            <p>
              <span className="font-medium">Created:</span>{' '}
              {new Date(company?.createdAt).toLocaleDateString()}
            </p>
          </div>
        </section>

        {/* Latest Quotes */}
        <section className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Quotes</h2>

          {company.quotes.length === 0 ? (
            <p className="text-gray-500 text-sm">No quotes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 border-b">
                    <th className="p-3 text-left">Customer</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {company.quotes.map((q: any) => (
                    <tr key={q.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{q.name}</td>
                      <td className="p-3">{q.email}</td>
                      <td className="p-3">
                        {new Date(q.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Device Issue Stats */}
        <section className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">Device Issues</h2>

          {issues.length === 0 ? (
            <p className="text-gray-500 text-sm">No issue data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 border-b">
                    <th className="p-3 text-left">Brand</th>
                    <th className="p-3 text-left">Model</th>
                    <th className="p-3 text-left">Device</th>
                    <th className="p-3 text-left">Issue</th>
                    <th className="p-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((i: any) => (
                    <tr key={i.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{i.deviceBrand}</td>
                      <td className="p-3">{i.deviceModel}</td>
                      <td className="p-3">{i.deviceType}</td>
                      <td className="p-3">{i.problemDescription}</td>
                      <td className="p-3">
                        {new Date(i.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

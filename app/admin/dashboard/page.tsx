'use client'

import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminDashboard() {
  const router = useRouter()
  const { data, error } = useSWR('/api/admin/stats', fetcher)

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/admin/login')
  }

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">
        Failed to load stats
      </div>
    )
  if (!data)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 text-lg">
        Loading dashboard...
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm border-b">
        <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          Logout
        </button>
      </header>

      {/* Stats Section */}
      <main className="p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white shadow rounded-xl p-6">
            <h3 className="text-gray-600">Total Companies</h3>
            <p className="text-2xl font-bold text-gray-800">{data.totalCompanies}</p>
          </div>
          <div className="bg-white shadow rounded-xl p-6">
            <h3 className="text-gray-600">Total Conversations</h3>
            <p className="text-2xl font-bold text-gray-800">{data.totalConversations}</p>
          </div>
          <div className="bg-white shadow rounded-xl p-6">
            <h3 className="text-gray-600">Total Quotes</h3>
            <p className="text-2xl font-bold text-gray-800">{data.totalQuotes}</p>
          </div>
        </div>

        {/* Latest Companies Table */}
        <div className="bg-white shadow rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Latest Companies</h2>
            <Link
              href="/admin/companies"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Manage Companies →
            </Link>
          </div>

          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="text-gray-600 border-b bg-gray-100">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Domain</th>
                <th className="p-3 text-center">Total Quotes</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.latestCompanies.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-medium">
                    <Link
                      href={`/admin/companies/${c.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="p-3">{c.email}</td>
                  <td className="p-3 text-gray-700">{c.domain}</td>
                  <td className="p-3 text-center font-semibold text-blue-600">
                    {c._count?.quotes ?? 0}
                  </td>
                  <td className="p-3 text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.latestCompanies.length === 0 && (
            <div className="text-center text-gray-500 py-6">
              No companies available yet.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

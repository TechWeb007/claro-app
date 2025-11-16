'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type SortKey = 'name' | 'domain' | 'quotes' | 'createdAt'

export default function CompaniesPage() {
  const router = useRouter()
  const { data, error } = useSWR('/api/admin/companies', fetcher)

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/admin/login')
  }

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">
        Failed to load companies
      </div>
    )
  if (!data)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 text-lg">
        Loading companies...
      </div>
    )

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sortIcon = (key: SortKey) => {
    if (key !== sortKey) return '⇅'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const filtered = (data as any[])
    .filter((company) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        company.name.toLowerCase().includes(q) ||
        company.domain.toLowerCase().includes(q) ||
        company.email.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      let valA: string | number
      let valB: string | number

      if (sortKey === 'name') {
        valA = a.name.toLowerCase()
        valB = b.name.toLowerCase()
      } else if (sortKey === 'domain') {
        valA = a.domain.toLowerCase()
        valB = b.domain.toLowerCase()
      } else if (sortKey === 'quotes') {
        valA = a._count?.quotes ?? 0
        valB = b._count?.quotes ?? 0
      } else {
        valA = new Date(a.createdAt).getTime()
        valB = new Date(b.createdAt).getTime()
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Companies</h1>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-lg font-medium text-gray-700">
            Registered Companies
          </h2>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by name, email, domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-72 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Link
              href="/admin/companies/new"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-blue-700 transition whitespace-nowrap"
            >
              + Add Company
            </Link>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
            No companies found.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-100 border-b text-gray-600 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-3 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="inline-flex items-center gap-1"
                    >
                      <span>Name</span>
                      <span className="text-[10px]">{sortIcon('name')}</span>
                    </button>
                  </th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort('domain')}
                      className="inline-flex items-center gap-1"
                    >
                      <span>Domain</span>
                      <span className="text-[10px]">{sortIcon('domain')}</span>
                    </button>
                  </th>
                  <th className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort('quotes')}
                      className="inline-flex items-center gap-1"
                    >
                      <span>Total Quotes</span>
                      <span className="text-[10px]">{sortIcon('quotes')}</span>
                    </button>
                  </th>
                  <th className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('createdAt')}
                      className="inline-flex items-center gap-1"
                    >
                      <span>Created</span>
                      <span className="text-[10px]">{sortIcon('createdAt')}</span>
                    </button>
                  </th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((company: any) => (
                  <tr
                    key={company.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-3 font-medium">
                      <Link
                        href={`/admin/companies/${company.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {company.name}
                      </Link>
                    </td>
                    <td className="p-3">{company.email}</td>
                    <td className="p-3 text-gray-700">{company.domain}</td>
                    <td className="p-3 text-center font-semibold text-blue-600">
                      {company._count?.quotes ?? 0}
                    </td>
                    <td className="p-3 text-right text-xs text-gray-500">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right space-x-3">
                      <Link
                        href={`/admin/companies/${company.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium transition"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Trash2, LogOut, Plus, UserPlus, Settings, Edit2, X, Check } from 'lucide-react'

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Create/Edit User State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [editingUser, setEditingUser] = useState<any | null>(null)
  
  // Assign Channel State
  const [selectedUserId, setSelectedUserId] = useState('')
  const [channelName, setChannelName] = useState('Facebook')
  const [sheetUrl, setSheetUrl] = useState('')

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users')
      setUsers(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users'
      const method = editingUser ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
         method,
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           email: email || undefined, 
           password: password || undefined, 
           company_name: companyName 
         })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      alert(editingUser ? 'Utilizator actualizat!' : 'Utilizator creat cu succes!')
      resetUserForm()
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const resetUserForm = () => {
    setEmail('')
    setPassword('')
    setCompanyName('')
    setEditingUser(null)
  }

  const startEditUser = (user: any) => {
    setEditingUser(user)
    setCompanyName(user.company_name || '')
    setEmail(user.email || '')
    setPassword('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest utilizator? Toate datele asociate vor fi șterse.')) return
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      alert('Utilizator șters!')
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('Ștergi acest canal?')) return
    try {
      const res = await fetch(`/api/admin/channels/${channelId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAssignChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const res = await fetch('/api/admin/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          name: channelName,
          sheet_url: sheetUrl
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      alert('Canal atribuit cu succes!')
      setSheetUrl('')
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
               <Settings className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Admin Panel</h1>
              <p className="text-slate-500">Gestionare clienți și configurații</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all font-medium shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Deconectare
          </button>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <strong>Eroare:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-8">
            {/* Create/Edit User Form */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${editingUser ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    {editingUser ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{editingUser ? 'Editează Client' : 'Client Nou'}</h2>
                </div>
                {editingUser && (
                  <button onClick={resetUserForm} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <form onSubmit={handleCreateOrUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Nume Companie</label>
                  <input required type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Acme Inc." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Email (Lăsați gol pentru a păstra)</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="client@exemplu.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Parolă (Lăsați gol pentru a păstra)</label>
                  <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="••••••••" />
                </div>
                <button type="submit" className={`w-full text-white font-semibold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2 ${editingUser ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}>
                  {editingUser ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingUser ? 'Salvează Modificările' : 'Creează Cont'}
                </button>
              </form>
            </section>

            {/* Assign Channel Form */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Adaugă Canal</h2>
              </div>
              <form onSubmit={handleAssignChannel} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Client</label>
                  <select required value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none">
                    <option value="" disabled>Alege client...</option>
                    {users.filter(u => u.role !== 'admin').map(u => (
                      <option key={u.id} value={u.id}>{u.company_name || u.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Platformă</label>
                  <select required value={channelName} onChange={e => setChannelName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none">
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Site">Site</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Link CSV (Edit link ok)</label>
                  <input required type="url" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="https://docs.google.com/spreadsheets/..." />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-2 mt-2">
                  Salvează Configurația
                </button>
              </form>
            </section>
          </div>

          {/* Users List */}
          <div className="lg:col-span-2">
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-8 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Clienți Activi</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="text-left px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                      <th className="text-left px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Canale Configurate</th>
                      <th className="text-right px-8 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.filter(u => u.role !== 'admin').map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-bold text-slate-800">{u.company_name || 'Fără nume'}</div>
                          <div className="text-sm text-slate-500">{u.id.substring(0, 8)}...</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-wrap gap-2">
                            {u.channels && u.channels.length > 0 ? (
                              u.channels.map((ch: any) => (
                                <div key={ch.id} className="group relative">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 pr-7 transition-all">
                                    {ch.name}
                                    <button 
                                      onClick={() => handleDeleteChannel(ch.id)}
                                      className="absolute right-2 opacity-0 group-hover:opacity-100 text-blue-400 hover:text-red-500 transition-all"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">Niciun canal</span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => startEditUser(u)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Editează client"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Șterge utilizator"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.filter(u => u.role !== 'admin').length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-8 py-12 text-center text-slate-400 italic">
                          Nu există clienți înregistrați.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

        </div>

      </div>
    </div>
  )
}

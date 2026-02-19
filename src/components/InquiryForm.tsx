'use client'

import { useState } from 'react'

export default function InquiryForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus('문의 접수 중...')

    const res = await fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, message, website: '' }),
    })
    const json = await res.json()

    if (!res.ok) {
      setStatus(json?.error ?? '문의 접수에 실패했습니다.')
      setLoading(false)
      return
    }

    setStatus('문의가 접수되었습니다. 빠르게 연락드리겠습니다. ✅')
    setName('')
    setPhone('')
    setMessage('')
    setLoading(false)
  }

  return (
    <form onSubmit={onSubmit} className="ui-card ui-fade-in p-5 space-y-3 text-slate-200">
      <h3 className="text-lg font-semibold text-slate-100">문의하기</h3>
      <input className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900" placeholder="성함" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900" placeholder="연락처" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <textarea className="w-full border border-slate-300 rounded px-3 py-2 min-h-28 bg-white text-slate-900" placeholder="문의 내용" value={message} onChange={(e) => setMessage(e.target.value)} required />
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" onChange={() => {}} />
      <button className="ui-btn-primary px-4 py-2 disabled:opacity-50" disabled={loading}>
        {loading ? '접수 중...' : '문의 접수'}
      </button>
      {status ? <p className="text-sm text-slate-300">{status}</p> : null}
    </form>
  )
}

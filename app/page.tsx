'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type StatusEntry = {
  status: 'up' | 'down'
  updatedAt: string
  responseTime: number
}

type LogEntry = {
  timestamp: string
  status: string
  responseTime: number
}

const sites = [
  { name: 'IDwebhost', url: 'https://idwebhost.com' },
  { name: 'ChatGPT', url: 'https://chatgpt.com' },
  { name: 'JCAMP Demo', url: 'https://demo.jcamp.biz' },
]

export default function StatusPage() {
  const [status, setStatus] = useState<Record<string, StatusEntry>>({})
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({})
  const [downtime, setDowntime] = useState<Record<string, { totalDowntime: number }>>({})

  const checkStatus = async () => {
    const res = await fetch('/api/check-status')
    const data = await res.json()
    setStatus(data.status)
    setLogs(data.logs)
    setDowntime(data.downtimeTracker)
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-3xl font-bold mb-6">Status Monitoring</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sites.map(site => {
          const s = status[site.name]
          const siteLogs = logs[site.name] || []
          const downMs = downtime[site.name]?.totalDowntime || 0
          const downMins = Math.floor(downMs / 60000)

          return (
            <div key={site.name} className="p-4 border rounded-2xl shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{site.name}</h2>
              <p className="text-sm text-gray-500 break-all">{site.url}</p>
              <div className="mt-2 space-y-1 text-sm">
                <p>Status: <span className={s?.status === 'up' ? 'text-green-600' : 'text-red-600'}>{s?.status === 'up' ? '🟢 Online' : '🔴 Down'}</span></p>
                <p>Ping: {s?.responseTime ?? '-'}ms</p>
                <p className="text-xs text-gray-400">Terakhir dicek: {s?.updatedAt ? new Date(s.updatedAt).toLocaleString() : '-'}</p>
                <p>Total Downtime: {downMins} menit</p>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-gray-700">Riwayat & Grafik</summary>
                <div className="mt-2">
                  <ul className="text-xs mb-3 max-h-32 overflow-auto space-y-1">
                    {siteLogs.map((log, i) => (
                      <li key={i}>
                        <span className={log.status === 'up' ? 'text-green-600' : 'text-red-600'}>{log.status.toUpperCase()}</span>
                        {' '} - {new Date(log.timestamp).toLocaleString()} ({log.responseTime}ms)
                      </li>
                    ))}
                  </ul>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={siteLogs.slice().reverse()}>
                        <XAxis dataKey="timestamp" hide />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="responseTime" stroke="#3b82f6" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </details>
            </div>
          )
        })}
      </div>
    </div>
  )
}
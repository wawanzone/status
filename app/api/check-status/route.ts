const logs = {}
const downtimeTracker = {}

export async function GET() {
  const sites = [
    { name: 'IDwebhost', url: 'https://idwebhost.com' },
    { name: 'ChatGPT', url: 'https://chatgpt.com' },
    { name: 'JCAMP Demo', url: 'https://demo.jcamp.biz' },
  ]

  const now = new Date().toISOString()

  const fetchStatus = async (site) => {
    const start = Date.now()
    try {
      const res = await fetch(site.url, { method: 'HEAD', cache: 'no-store' })
      const ms = Date.now() - start
      const status = res.ok ? 'up' : 'down'

      updateLog(site.name, now, status, ms)
      return [site.name, { status, responseTime: ms, updatedAt: now }]
    } catch {
      const ms = Date.now() - start
      updateLog(site.name, now, 'down', ms)
      return [site.name, { status: 'down', responseTime: ms, updatedAt: now }]
    }
  }

  const updateLog = (name, timestamp, status, ms) => {
    logs[name] = logs[name] || []
    logs[name].unshift({ timestamp, status, responseTime: ms })
    logs[name] = logs[name].slice(0, 100)

    downtimeTracker[name] = downtimeTracker[name] || { totalDowntime: 0 }

    if (status === 'down') {
      if (!downtimeTracker[name].lastDownStart) {
        downtimeTracker[name].lastDownStart = timestamp
      }
    } else {
      if (downtimeTracker[name].lastDownStart) {
        const start = new Date(downtimeTracker[name].lastDownStart).getTime()
        const end = new Date(timestamp).getTime()
        const duration = end - start
        downtimeTracker[name].totalDowntime += duration
        downtimeTracker[name].lastDownStart = undefined
      }
    }
  }

  const statusPairs = await Promise.all(sites.map(fetchStatus))
  const status = Object.fromEntries(statusPairs)

  return new Response(JSON.stringify({ status, logs, downtimeTracker }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
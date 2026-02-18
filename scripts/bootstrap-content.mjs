import fs from 'node:fs'

function loadEnvLocal() {
  const p = '.env.local'
  if (!fs.existsSync(p)) return
  const raw = fs.readFileSync(p, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const k = line.slice(0, idx).trim()
    const v = line.slice(idx + 1).trim()
    if (!(k in process.env)) process.env[k] = v
  }
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRole) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const headers = {
  apikey: serviceRole,
  Authorization: `Bearer ${serviceRole}`,
  'Content-Type': 'application/json',
}

async function ensureBucket() {
  const bucketId = 'site-assets'
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: bucketId, name: bucketId, public: true }),
  })

  if (res.ok) {
    console.log('Bucket created: site-assets')
    return
  }
  const text = await res.text()
  if (res.status === 409 || text.toLowerCase().includes('duplicate')) {
    console.log('Bucket already exists: site-assets')
    return
  }
  console.log('Bucket create skipped:', res.status, text)
}

async function seedContent() {
  const payload = [{
    key: 'home',
    title: 'mrtc.kr',
    subtitle: '환영합니다',
    body: '이 텍스트는 관리자 페이지에서 수정할 수 있습니다.',
    hero_image_url: '',
  }]

  const res = await fetch(`${url}/rest/v1/site_content?on_conflict=key`, {
    method: 'POST',
    headers: {
      ...headers,
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  if (!res.ok) {
    console.log('Seed failed:', res.status)
    console.log(text)
    if (text.includes('relation "public.site_content" does not exist') || text.includes('Could not find the table')) {
      console.log('\n[Action Required] Supabase SQL Editor에서 supabase/schema.sql을 1회 실행해 주세요.')
    }
    return
  }

  console.log('Seed success:', text)
}

await ensureBucket()
await seedContent()

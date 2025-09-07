import axios from 'axios'

// Možeš postaviti kroz .env: VITE_API_BASE_URL=https://localhost:7048
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7048'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  // withCredentials: true, // ⇐ uključi ako koristiš cookie auth
})

// Normaliziraj putanju: dodaj leading "/" i prefix "/api" kad treba
function normalizeUrl(url) {
  if (!url) return url

  // Ako je apsolutni URL, ne diramo
  if (/^https?:\/\//i.test(url)) return url

  // Leading slash
  if (!url.startsWith('/')) url = '/' + url

  // Ako već počinje s /api/, ostavi
  if (url.startsWith('/api/')) return url

  // Inače prefiksaj /api
  return '/api' + url
}

api.interceptors.request.use(
  (config) => {
    const original = config.url || ''
    config.url = normalizeUrl(original)

    // NE postavljamo globalno 'Content-Type' (posebno ne za FormData)
    // Header-e postavljaj samo po potrebi u pojedinačnim pozivima.

    console.log('🔄', (config.method || 'GET').toUpperCase(), config.baseURL + (config.url || ''))
    return config
  },
  (error) => {
    console.error('❌ Request error:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    console.log('✅', response.status, response.config?.baseURL + (response.config?.url || ''))
    return response
  },
  (error) => {
    const status = error?.response?.status
    const fullUrl = (error?.config?.baseURL || '') + (error?.config?.url || '')
    console.error('❌ Response error:', status, fullUrl)
    if (error?.response?.data) console.error('🛈 Details:', error.response.data)
    return Promise.reject(error)
  }
)

export default api

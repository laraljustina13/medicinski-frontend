import axios from 'axios'

const API_BASE_URL = 'https://localhost:7048/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor za error handling
api.interceptors.request.use(
  (config) => {
    console.log('🔄 API Request:', config.method?.toUpperCase(), config.url)
    console.log('📤 Request data:', config.data)
    return config
  },
  (error) => {
    console.error('❌ Request error:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.config?.url)
    console.error('❌ Error details:', error.response?.data)
    return Promise.reject(error)
  }
)

export default api
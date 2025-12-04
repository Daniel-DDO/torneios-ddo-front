// Serviço de configuração da API Backend
const API_BASE_URL = 'https://torneios-ddo-back.onrender.com'

export const API = {
  baseURL: API_BASE_URL,

  async get(endpoint: string) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`)
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('GET Error:', error)
      throw error
    }
  },

  async post(endpoint: string, data?: Record<string, any>) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {}),
      })
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('POST Error:', error)
      throw error
    }
  },

  async put(endpoint: string, data?: Record<string, any>) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {}),
      })
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('PUT Error:', error)
      throw error
    }
  },

  async delete(endpoint: string) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('DELETE Error:', error)
      throw error
    }
  },
}

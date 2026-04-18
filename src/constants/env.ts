export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010').trim()
export const TEST_TOKEN = (import.meta.env.VITE_TEST_TOKEN || 'echaootest').trim()
export const REQUEST_TIMEOUT = Number(import.meta.env.VITE_REQUEST_TIMEOUT || 30000)

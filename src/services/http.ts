import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { API_BASE_URL, REQUEST_TIMEOUT } from '@/constants/env'
import { STORAGE_KEYS } from '@/constants/storage'
import { getString } from '@/utils/storage'

interface BusinessError extends Error {
  code?: number
  status?: number
  data?: unknown
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT
})

http.interceptors.request.use((config) => {
  const token = getString(STORAGE_KEYS.token)
  const headers = (config.headers || {}) as any

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (!(config.data instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  config.headers = headers
  return config
})

function buildBusinessError(responseData: any, fallbackMessage = '请求失败') {
  const error = new Error(responseData?.message || fallbackMessage) as BusinessError

  if (typeof responseData?.code === 'number') {
    error.code = responseData.code
  }

  if (typeof responseData?.status === 'number') {
    error.status = responseData.status
  }

  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    error.data = responseData.data
  }

  return error
}

function unwrapResponse<T>(response: AxiosResponse<any>) {
  const responseData = response.data

  if (response.status >= 200 && response.status < 300) {
    if (responseData && typeof responseData === 'object') {
      const businessStatus = typeof responseData.status === 'number' ? responseData.status : response.status
      const businessCode = typeof responseData.code === 'number' ? responseData.code : 0

      if (businessStatus === 401 || businessCode === 101 || businessCode === 103) {
        throw buildBusinessError(responseData, '登录已过期')
      }

      if (responseData.success === false || businessStatus >= 400 || businessCode < 0) {
        throw buildBusinessError(responseData)
      }
    }

    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return responseData.data as T
    }

    return responseData as T
  }

  throw buildBusinessError(responseData)
}

function normalizeAxiosError(error: unknown): Error {
  if (error instanceof Error && !(error as AxiosError).isAxiosError) {
    return error
  }

  const axiosError = error as AxiosError<any>

  if (axiosError.response?.data) {
    return buildBusinessError(axiosError.response.data)
  }

  if (error instanceof Error) {
    return error
  }

  return new Error(axiosError.message || '网络请求失败')
}

export async function request<T = unknown>(config: AxiosRequestConfig) {
  try {
    const response = await http.request(config)
    return unwrapResponse<T>(response)
  } catch (error) {
    throw normalizeAxiosError(error)
  }
}

export function get<T = unknown>(url: string, config?: AxiosRequestConfig) {
  return request<T>({ ...config, url, method: 'GET' })
}

export function post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return request<T>({ ...config, url, method: 'POST', data })
}

export function del<T = unknown>(url: string, config?: AxiosRequestConfig) {
  return request<T>({ ...config, url, method: 'DELETE' })
}

export { http }

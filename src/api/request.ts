/**
 * 网络请求封装 - Axios 版本
 */
import axios, { type AxiosRequestConfig } from 'axios'
import { API_BASE_URL, TEST_TOKEN, REQUEST_TIMEOUT } from './config'

// 创建 axios 实例
const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加 Token
instance.interceptors.request.use(
  (config) => {
    // 检查是否需要认证（默认需要）
    const needAuth = config.headers?.['X-Need-Auth'] !== 'false'
    if (needAuth) {
      config.headers['Authorization'] = `Bearer ${TEST_TOKEN}`
    }
    // 删除自定义 header
    delete config.headers?.['X-Need-Auth']
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 - 提取 data 字段
instance.interceptors.response.use(
  (response) => {
    const responseData = response.data
    // 后端返回格式：{ code, success, status, data }
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return responseData.data
    }
    return responseData
  },
  (error) => {
    const errorMsg = error.response?.data?.message || error.message || '网络请求失败'
    return Promise.reject(new Error(errorMsg))
  }
)

/**
 * GET 请求
 */
export function get<T = any>(url: string, needAuth = true): Promise<T> {
  const config: AxiosRequestConfig = {}
  if (!needAuth) {
    config.headers = { 'X-Need-Auth': 'false' }
  }
  return instance.get(url, config)
}

/**
 * POST 请求
 */
export function post<T = any>(url: string, data?: any, needAuth = true): Promise<T> {
  const config: AxiosRequestConfig = {}
  if (!needAuth) {
    config.headers = { 'X-Need-Auth': 'false' }
  }
  return instance.post(url, data, config)
}

/**
 * DELETE 请求
 */
export function del<T = any>(url: string, needAuth = true): Promise<T> {
  const config: AxiosRequestConfig = {}
  if (!needAuth) {
    config.headers = { 'X-Need-Auth': 'false' }
  }
  return instance.delete(url, config)
}

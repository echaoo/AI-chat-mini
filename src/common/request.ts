/**
 * 网络请求封装
 */
import mpx from '@mpxjs/core'
import { API_BASE_URL, TEST_TOKEN, REQUEST_TIMEOUT } from './config'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  needAuth?: boolean
}

/**
 * 统一请求方法
 */
export function request<T = any>(options: RequestOptions): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    needAuth = true
  } = options

  // 添加 Token
  if (needAuth) {
    header['Authorization'] = `Bearer ${TEST_TOKEN}`
  }

  const fullUrl = `${API_BASE_URL}${url}`

  return mpx.request({
    url: fullUrl,
    method,
    data,
    header: {
      'Content-Type': 'application/json',
      ...header
    },
    timeout: REQUEST_TIMEOUT
  }).then((res: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // 后端返回格式：{ code, success, status, data }
      // 提取 data 字段
      const responseData = res.data
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return responseData.data
      }
      return responseData
    } else {
      const errorMsg = res.data?.message || '请求失败'
      throw new Error(errorMsg)
    }
  }).catch((err: any) => {
    const errorMsg = err.errMsg || err.message || '网络请求失败'
    throw new Error(errorMsg)
  })
}

/**
 * GET 请求
 */
export function get<T = any>(url: string, needAuth = true): Promise<T> {
  return request<T>({ url, method: 'GET', needAuth })
}

/**
 * POST 请求
 */
export function post<T = any>(url: string, data?: any, needAuth = true): Promise<T> {
  return request<T>({ url, method: 'POST', data, needAuth })
}

/**
 * DELETE 请求
 */
export function del<T = any>(url: string, needAuth = true): Promise<T> {
  return request<T>({ url, method: 'DELETE', needAuth })
}

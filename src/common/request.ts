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

  return new Promise((resolve, reject) => {
    mpx.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      timeout: REQUEST_TIMEOUT,
      success: (res: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const error = new Error(res.data?.message || '请求失败')
          reject(error)
        }
      },
      fail: (err: any) => {
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
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

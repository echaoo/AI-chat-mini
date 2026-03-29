/**
 * 网络请求封装
 */
import mpx from '@mpxjs/core'
import { API_BASE_URL, REQUEST_TIMEOUT } from './config'
import store from './store'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  needAuth?: boolean
}

function buildBusinessError(responseData: any, fallbackMessage = '请求失败') {
  const error = new Error(responseData?.message || fallbackMessage) as Error & {
    code?: number
    status?: number
    data?: any
  }

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
    const token = store.state.token
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
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
      const responseData = res.data

      // 兼容后端 200 + 业务失败 的返回格式
      if (responseData && typeof responseData === 'object') {
        const businessStatus = typeof responseData.status === 'number' ? responseData.status : res.statusCode
        const businessCode = typeof responseData.code === 'number' ? responseData.code : 0

        if (businessStatus === 401 || businessCode === 101 || businessCode === 103) {
          store.dispatch('handleApiError', { data: { status: 401, code: businessCode, message: responseData.message } })
          throw buildBusinessError(responseData, '登录已过期')
        }

        if (responseData.success === false || businessStatus >= 400 || businessCode < 0) {
          throw buildBusinessError(responseData)
        }
      }

      // 后端返回格式：{ code, success, status, data }
      // 提取 data 字段
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return responseData.data
      }
      return responseData
    } else if (res.statusCode === 401) {
      // Token 过期或无效，触发重新登录
      store.dispatch('handleApiError', { data: { status: 401 } })
      throw new Error('登录已过期')
    } else if (res.statusCode === 403) {
      // 无权访问
      const errorMsg = res.data?.message || '无权访问'
      throw new Error(`403: ${errorMsg}`)
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

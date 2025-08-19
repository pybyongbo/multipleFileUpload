import axios, { AxiosRequestConfig, Canceler } from 'axios'
import qs from 'query-string'

let pendingMap = new Map()

// 序列化参数
export const getPendingUrl = (config) =>
	[config.method, config.url, qs.stringify(config.data), qs.stringify(config.params)].join('&')

export class AxiosCanceler {
	/**
	 * @desc 添加请求
	 * @param {object} config
	 * */
	addPending(config) {
		const url = getPendingUrl(config)
		config.cancelToken =
			config.cancelToken ||
			new axios.CancelToken((cancel) => {
				if (!pendingMap.has(url)) {
					pendingMap.set(url, cancel)
				}
			})
	}

	/**
	 * @desc 移除请求
	 * @param {object} config
	 * */
	removePending(config) {
		const url = getPendingUrl(config)
		if (pendingMap.has(url)) {
			const cancel = pendingMap.get(url)
			cancel && cancel()
			pendingMap.delete(url)
		}
	}
}

import { join } from 'path'
import { createReadStream } from 'fs'
import { isString, isObject, isArray } from 'ginlibs-type-check'

export const ReqCntMap: Record<string, number> = {}

export const getSettingInfo = (pathname: string, rules: any) => {
  const routeArr = pathname.split('/').filter((v) => v)
  const map = rules.map || {}
  let key = ''
  let settingInfo: any = ''
  for (let i = 0; i < routeArr.length; i++) {
    const route = routeArr[routeArr.length - i - 1]
    if (key) {
      key = `${route}/${key}`
    } else {
      key = route
    }
    settingInfo = map[key]
    if (settingInfo) {
      break
    }
  }
  if (isArray(settingInfo)) {
    const cnt = ReqCntMap[pathname] || 0
    ReqCntMap[pathname] = cnt + 1
    const info = settingInfo[cnt] || settingInfo[settingInfo.length - 1]
    if (ReqCntMap[pathname] >= settingInfo.length) {
      ReqCntMap[pathname] = 0
    }
    return info
  }
  return settingInfo
}

export const getFilePath = (fileDir: string, settingInfo: any) => {
  if (!settingInfo) {
    return ''
  }
  if (isString(settingInfo)) {
    return join(fileDir, settingInfo)
  }
  if (isObject(settingInfo)) {
    const fileName = settingInfo.fileName
    return join(fileDir, fileName)
  }
  return ''
}

export const passThroughReq = (serverSetting: any, req: any) => {
  const originalReq = req.originalReq
  const { relativeUrl } = originalReq
  const { host = '', pathHostMap = {} } = serverSetting || {}
  let proxyHost = host
  for (const key of Object.keys(pathHostMap)) {
    if (relativeUrl.startsWith(key)) {
      proxyHost = pathHostMap[key]
    }
  }
  req.passThrough(`${proxyHost}${relativeUrl}`)
}

export const readFileByStream = (filePath: string) => {
  const stream = createReadStream(filePath)
  return new Promise((resolve) => {
    const responseData: any = [] // 存储文件流
    stream.on('data', function (chunk) {
      responseData.push(chunk)
    })
    stream.on('end', function () {
      const finalData = Buffer.concat(responseData)
      resolve(finalData)
    })
  })
}

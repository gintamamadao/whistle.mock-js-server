import fsUtil from 'ginlibs-file-util'
import {
  getSettingInfo,
  getFilePath,
  passThroughReq,
  readFileByStream,
} from './utils'
import { sleep } from 'ginlibs-utils'
import { join, extname } from 'path'
import mime from 'mime-types'

const RULE_JS = 'server.js'
const RULE_JSON = 'server.json'

export const mockServer = async (req, res) => {
  try {
    const originalReq = req.originalReq
    const { ruleValue, relativeUrl } = originalReq
    const rulesJSFile = join(ruleValue, RULE_JS)
    const rulesJSONFile = join(ruleValue, RULE_JSON)
    if (!fsUtil.exist(rulesJSFile) && !fsUtil.exist(rulesJSONFile)) {
      res.end('Server setting no found')
      return
    }
    let serverSetting: any = {}
    if (fsUtil.exist(rulesJSFile)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const rules = require(rulesJSFile)
      serverSetting =
        typeof rules === 'function' ? rules(originalReq) : rules || {}
    } else {
      const rules = fsUtil.read(rulesJSONFile)
      serverSetting = JSON.parse(rules)
    }
    const { dir = '' } = serverSetting || {}
    const fileDir = join(ruleValue, dir)
    let pathname = relativeUrl
    if (relativeUrl.indexOf('?')) {
      pathname = relativeUrl.split('?')[0]
    }
    const settingInfo = getSettingInfo(pathname, serverSetting)

    if (!settingInfo) {
      passThroughReq(serverSetting, req)
      return
    }

    const filePath: string = getFilePath(fileDir, settingInfo)

    if (!filePath) {
      passThroughReq(serverSetting, req)
      return
    }

    if (settingInfo.time) {
      await sleep(settingInfo.time)
    }

    const mimeType = mime.lookup(filePath)
    const ext = extname(filePath)
    res.setHeader('content-type', mimeType)

    if (ext === '.json') {
      res.end(fsUtil.read(filePath))
      return
    }

    const data = await readFileByStream(filePath)
    res.end(data)
  } catch (e) {
    console.log(e, 'response')
    res.end(e)
  }
}

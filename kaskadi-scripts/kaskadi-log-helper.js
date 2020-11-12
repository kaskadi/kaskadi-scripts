// Helper class containing methods to handle logging

const kaskadiAppElement = document.querySelector('kaskadi-app')

class KaskadiLog {
  static log (severity, grouped, ...groupData) {
    if (kaskadiAppElement.appData.testEnv) {
      const data = groupData
      if (grouped) {
        console.group(groupData[0])
        data.shift()
      }
      switch (severity) {
        case 1:
          // simple log
          console.log(...data)
          break
        case 2:
          // warning
          console.warn(...data)
          break
        case 3:
          // error
          console.error(...data)
          break
        default:
          break
      }
      console.groupEnd()
    }
  }
}

export { KaskadiLog }

/* global customElements, fetch */
// Helper class containing all methods for loading content
import { KaskadiFetch } from './kaskadi-fetch-helper.js'
import { KaskadiLog } from './kaskadi-log-helper.js'

const kaskadiAppElement = document.querySelector('kaskadi-app')

class KaskadiLoad {
  // Utility method to load a script in the head of the document so we avoid CORS issue when using only import keyword
  // Takes as parameter:
  // - options (object): encapsulates the options for this method
  //  - secured (Boolean): determine whether the script should be loaded from a secured location. Required
  //  - srcUrl (String): URL where the script file can be found. Required
  //  - appName (String): name of the custom element defined in the script to be added. Required
  static async loadScript (options) {
    if (typeof options.secured === 'undefined') {
      throw new Error('"secured" (Boolean) must be defined in the "options" parameter of this method')
    }
    if (!options.srcUrl) {
      throw new Error('"srcUrl" (String) must be defined in the "options" parameter of this method')
    }
    if (!options.appName) {
      throw new Error('"appName" (String) must be defined in the "options" parameter of this method')
    }
    let { secured, srcUrl, appName } = options
    if (secured) {
      if (KaskadiFetch.signedUrlNeedsRefresh()) {
        await KaskadiFetch.refreshSignedUrl()
      }
      const signedUrlData = KaskadiFetch.getSignedUrlData()
      srcUrl = `${srcUrl}?Policy=${signedUrlData.policy}&Key-Pair-Id=${signedUrlData.keyPairId}&Signature=${signedUrlData.signature}`
    }
    // if the element is not registered then we load the script fully
    if (!customElements.get(appName)) {
      const appScript = document.createElement('script')
      appScript.src = srcUrl
      appScript.id = `${appName}-script`
      appScript.type = 'module'
      document.head.appendChild(appScript)
      await customElements.whenDefined(appName)
      return
    }
    // if the element is already registered and the src property is outdated then we refresh it in case the file has to be fetched again
    if (customElements.get(appName) && document.head.querySelector(`#${appName}-script`).src !== srcUrl) {
      document.head.querySelector(`#${appName}-script`).src = srcUrl
    }
  }

  // Utility method to load an application in a given element. Recommended to use this function with try/catch to avoid execution termination
  // Takes as parameter:
  // - options (object): this encapsulate the options for this function
  //    - secured (boolean): define whether the distribution for this app is secured (should we use securedFetch or regular fetch?). Required
  //    - domain (string): where the application can be found. Includes protocol. Required
  //    - path (string): path to our application inside of its distribution. Required
  //    - dest (Element): the destination element into which we want to load our app. Required
  static async loadApp (options) {
    if (typeof options.secured === 'undefined') {
      throw new Error('"secured" (Boolean) must be defined in the "options" parameter of this method')
    }
    if (!options.domain) {
      throw new Error('"domain" (String) must be defined in the "options" parameter of this method')
    }
    if (!options.path) {
      throw new Error('"path" (String) must be defined in the "options" parameter of this method')
    }
    if (!options.dest) {
      throw new Error('"dest" (Element) must be defined in the "options" parameter of this method')
    }
    const { secured, domain, path, dest } = options
    const appName = path.split('/')[path.split('/').length - 1].split('.')[0]
    if (dest.querySelector(appName)) {
      KaskadiLog.log(2, false, `${appName} is already loaded, not proceeding to load`)
      return
    }
    const loadScriptOptions = {
      secured,
      srcUrl: `${domain}${path}`,
      appName
    }
    await KaskadiLoad.loadScript(loadScriptOptions)
    const app = document.createElement(appName)
    app.setAttribute('lang', kaskadiAppElement.appData.lang)
    app.userData = kaskadiAppElement.userData
    app.app = kaskadiAppElement
    app.addEventListener('language-change', kaskadiAppElement.setLanguage)
    const appJsonPath = loadScriptOptions.srcUrl.replace(`${appName}.js`, 'app.json')
    const appJson = await fetch(`${appJsonPath}`).then(res => res.json())
    let shouldHit = false
    if (appJson.routes) {
      appJson.routes.forEach(route => {
        if (route.listener) {
          shouldHit = true
          kaskadiAppElement.shadowRoot.querySelector(`kaskadi-route[path="${route.path}"]`).removeEventListener('hit', app[route.listener].bind(app))
          kaskadiAppElement.shadowRoot.querySelector(`kaskadi-route[path="${route.path}"]`).addEventListener('hit', app[route.listener].bind(app))
        }
      })
    }
    // before loading the app we need to unload everything currently loaded
    while (dest.firstElementChild) {
      dest.removeChild(dest.firstElementChild)
    }
    dest.appendChild(app)
    if (shouldHit) {
      kaskadiAppElement.shadowRoot.querySelector('kaskadi-router').match(window.location.href.replace(window.location.origin, ''))
    }
  }
}

export { KaskadiLoad }

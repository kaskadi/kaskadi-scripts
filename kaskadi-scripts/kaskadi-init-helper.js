// Helper class containg methods to initialize our app
import { KaskadiLoad } from './kaskadi-load-helper.js'
import { KaskadiFetch } from './kaskadi-fetch-helper.js'
import { KaskadiAuth } from './kaskadi-auth-helper.js'
import { KaskadiLang } from './kaskadi-lang-helper.js'
import { KaskadiLog } from './kaskadi-log-helper.js'

class KaskadiInit {
  // Method to initialize our app with initial property values
  static appInit () {
    const testEnv = window.location.hostname === 'localhost' ? true : false
    const kaskadiAPIDomain = 'https://api.klimapartner.net'
    const publicDistribution = testEnv ? `http://${window.location.host}` : 'https://cdn.klimapartner.net'
    const privateDistribution = testEnv ? `http://${window.location.host}` : 'https://d1flflxl3xfwo0.cloudfront.net'
    // define default language if not already defined in localStorage
    const supportedLanguages = ['de', 'en', 'fr']
    let lang
    if (!localStorage.getItem('lang')) {
      lang = window.navigator.language.split('-')[0] // retrieve user browser language
      // if the language from the browser isn't included in the supported languages then we default to german
      if (!supportedLanguages.includes(lang)) {
        lang = 'de'
      }
      localStorage.setItem('lang', lang)
    } else {
      lang = localStorage.getItem('lang')
    }
    // retrieve user data if they exist
    const userData = {
      ...JSON.parse(localStorage.getItem('userData'))
    }
    // store all those information to return it to the helper caller
    const appData = {
      testEnv,
      publicDistribution,
      privateDistribution,
      kaskadiAPIDomain,
      lang
    }
    const helpers = {
      KaskadiLoad,
      KaskadiFetch,
      KaskadiAuth,
      KaskadiLang,
      KaskadiLog
    }
    return {
      appData,
      userData,
      helpers
    }
  }
}

export { KaskadiInit }

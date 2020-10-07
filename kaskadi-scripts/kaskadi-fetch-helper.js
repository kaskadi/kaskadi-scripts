// Helper class containing all methods for content fetching

import { KaskadiAuth } from './kaskadi-auth-helper.js'
import { KaskadiLog } from './kaskadi-log-helper.js'

const kaskadiAppElement = document.querySelector('kaskadi-app')

class KaskadiFetch {
  // Utility method to send request to a secured endpoint
  static async securedFetch (url, method, body) {
    if (!url) {
      throw 'A URL must be provided in order to fetch'
    }
    const jwt = localStorage.getItem('cognitoJWT')
    const init = {
      method: method ? method : 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`
      },
      body
    }
    try {
      const res = await fetch(url, init).then(async (res) => {
        const body = await res.json()
        if (res.status !== 200) {
          throw {
            statusCode: res.status,
            ...body
          }
        }
        return body
      })
      return res
    } catch(err) {
      // if we receive an authorization error that means that our JWT is most likely expired so we refresh it and call again the method to get a response
      if (err.statusCode === 401) {
        const refreshToken = await localStorage.getItem('refreshToken')
        const refreshData = await KaskadiAuth.refreshJwt(refreshToken, 'Cognito')
        if (refreshData.statusCode !== 200) {
          KaskadiAuth.logout()
          return
        }
        return await securedFetch(url, method, body)
      }
      return Promise.reject(err)
    }
  }
  // Utility method to determine whether signed URL information need to be refreshed
  static signedUrlNeedsRefresh () {
    const signedUrlData = KaskadiFetch.getSignedUrlData()
    // we check if we need to refresh our signedUrl by checking if the information are already stored
    if (!signedUrlData.policy && !signedUrlData.signature && !signedUrlData.keyPairId) {
      return true
    } else {
      // if the information are stored we need to check if the expiration time is consumed
      const decodedPolicy = JSON.parse(atob(signedUrlData.policy.replace(/_/g, '')))
      const currentTime = (new Date()).getTime()
      if (decodedPolicy.Statement[0].Condition.DateLessThan['AWS:EpochTime'] < currentTime) {
        return true
      }
    }
    return false
  }
  // Utility method to refresh signedUrl
  static async refreshSignedUrl () {
    const signedUrlRes = await KaskadiFetch.securedFetch(`${kaskadiAppElement.appData.kaskadiAPIDomain}/auth/get-signed-url`)
    const signedUrl = new URL(signedUrlRes.signedUrl)
    const signedUrlSearchParams = signedUrl.searchParams
    localStorage.setItem('signedUrlPolicy', signedUrlSearchParams.get('Policy'))
    localStorage.setItem('signedUrlSignature', signedUrlSearchParams.get('Signature'))
    localStorage.setItem('signedUrlKeyPairId', signedUrlSearchParams.get('Key-Pair-Id'))
  }
  // Utility method to retrieve signed URL data
  static getSignedUrlData () {
    return {
      policy: localStorage.getItem('signedUrlPolicy'),
      signature: localStorage.getItem('signedUrlSignature'),
      keyPairId: localStorage.getItem('signedUrlKeyPairId')
    }
  }
  // Utility method to fetch the app-section mapping and the new routerPaths value
  static fetchApps () {
    return fetch(`${kaskadiAppElement.appData.kaskadiAPIDomain}/apps`).then(res => res.json())
  }
  // Utility to fetch loading spinner from CDN
  static async fetchLoadingSpinner () {
    const parser = new DOMParser()
    const loadingSpinnerData = await (await fetch(`${kaskadiAppElement.appData.publicDistribution}/imgs/icons/loading-spinner.svg`)).text()
    const loadingSpinner = parser.parseFromString(loadingSpinnerData, "image/svg+xml").querySelector('svg')
    return loadingSpinner
  }
}

export { KaskadiFetch }

/* global fetch, localStorage, atob, DOMParser */
// Helper class containing all methods for content fetching
import { KaskadiAuth } from './kaskadi-auth-helper.js'

const kaskadiAppElement = document.querySelector('kaskadi-app')

class KaskadiFetch {
  // Utility method to send request to a secured endpoint
  static securedFetch (url, method, body) {
    if (!url) {
      throw new Error('A URL must be provided in order to fetch')
    }
    const init = {
      method: method || 'GET',
      headers: { Authorization: `Bearer ${localStorage.getItem('cognitoJWT')}` },
      body
    }
    return fetch(url, init)
      .then(async res => {
        const body = await res.json()
        if (res.status === 401) {
          const refreshData = await KaskadiAuth.refreshJwt(localStorage.getItem('refreshToken'), 'Cognito')
          return refreshData.statusCode === 200
            ? this.securedFetch(url, method, body)
            : KaskadiAuth.logout().then(() => Promise.reject(new Error('Authentication data expired, please log in again.')))
        }
        if (res.status !== 200) {
          throw new Error('Something happened...')
        }
        return body
      })
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
    const loadingSpinner = parser.parseFromString(loadingSpinnerData, 'image/svg+xml').querySelector('svg')
    return loadingSpinner
  }
}

export { KaskadiFetch }

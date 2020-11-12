/* global fetch, localStorage, atob */
// Helper class containing methods to handle authentication

import { KaskadiLog } from './kaskadi-log-helper.js'

const kaskadiAppElement = document.querySelector('kaskadi-app')

class KaskadiAuth {
  // Utility method to check if the user is currently authenticated
  static async isUserAuth () {
    const jwt = localStorage.getItem('cognitoJWT')
    if (jwt) {
      // if there is a JWT we retrieve the expiration time
      const expTime = JSON.parse(atob(jwt.split('.')[1])).exp
      const currentTime = (new Date()).getTime()
      if (expTime * 1000 < currentTime) {
        // if JWT has expired, we refresh it
        KaskadiLog.log(1, false, 'Token has expired, refreshing it')
        const refreshToken = localStorage.getItem('refreshToken')
        const refreshData = await KaskadiAuth.refreshJwt(refreshToken, 'Cognito')
        if (refreshData.statusCode !== 200) {
          return false
        }
        localStorage.setItem('cognitoJWT', refreshData.body.idToken)
        localStorage.setItem('accessToken', refreshData.body.accessToken)
        return true
      }
      // otherwise he's authenticated
      return true
    }
    // if we didn't find a JWT then the user isn't authenticated
    return false
  }

  // Helper method for refreshing JWT token
  static async refreshJwt (refreshToken, method) {
    const init = {
      method: 'POST',
      body: JSON.stringify({
        refreshToken,
        method
      })
    }
    const res = await fetch(`${kaskadiAppElement.appData.kaskadiAPIDomain}/auth/refresh`, init)
    const resBody = await res.json()
    return {
      statusCode: res.status,
      body: resBody
    }
  }

  // Logout event handler
  static async logout (ev) {
    const router = kaskadiAppElement.shadowRoot.querySelector('kaskadi-router')
    if (localStorage.getItem('accessToken')) {
      // hit global sign out endpoint to revoke tokens
      const init = {
        method: 'POST',
        body: JSON.stringify({
          accessToken: localStorage.getItem('accessToken')
        })
      }
      await fetch(`${kaskadiAppElement.appData.kaskadiAPIDomain}/auth/logout`, init)
      KaskadiAuth.clearLocalStorage()
      // redirect to login page
      kaskadiAppElement.helpers.KaskadiLog.log(1, false, 'User requested logout')
      router.referer = window.location.href.replace(window.location.origin, '')
    }
    router.goto('/login')
  }

  // Clear storage helper method
  static clearLocalStorage () {
    // clear all secured data
    localStorage.removeItem('cognitoJWT')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userData')
    localStorage.removeItem('signedUrlPolicy')
    localStorage.removeItem('signedUrlSignature')
    localStorage.removeItem('signedUrlKeyPairId')
  }
}

export { KaskadiAuth }

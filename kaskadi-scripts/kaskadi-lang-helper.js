// Helper class containing methods to manipulate language in the application

class KaskadiLang {
  // helper method to propagate language change
  static propagateLanguage (lang, target) {
    if (target.nodeName === 'KASKADI-ROUTER') {
      return
    }
    if (target.nodeName.split('-')[0] === 'KASKADI' && target.nodeName !== 'KASKADI-APP') {
      target.setAttribute('lang', lang)
    }
    // define our new collection of child element to continue propagation
    const childElements = target.nodeName.split('-')[0] === 'KASKADI' ? target.shadowRoot.children : target.children
    Array.from(childElements).forEach(app => {
      KaskadiLang.propagateLanguage(lang, app)
    })
  }
}

export { KaskadiLang }

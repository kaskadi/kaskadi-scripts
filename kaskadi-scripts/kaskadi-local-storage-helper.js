class KaskadiLocalStorage {
  static get (keys) {
    let data = {}
    for (const key of keys) {
      data[key] = localStorage.getItem(key)
    }
    return data
  }
  static set (data) {
    for (const prop in data) {
      let value = data[prop]
      value = typeof value === 'object' && value !== null ? JSON.stringify(value) : value
      localStorage.setItem(prop, value)
    }
    return true
  }
  static remove (keys) {
    for (const key of keys) {
      localStorage.removeItem(key)
    }
    return true
  }
}

export { KaskadiLocalStorage }


export default class Service {
    #errorListeners = []
    onError = listener => this.#errorListeners.push(listener)
    error = e => this.#errorListeners.map(l.bind(e, e))
}
import { IncomingMessage } from 'http'

Object.cast = function cast(obj, type) {
    if (obj === undefined)
        return undefined

    const casted = new type(obj)
    return Object.isFunction(casted) ? new casted(obj) : casted
}

Object.defineProperty(Object.prototype, Object.cast.name, {
    value: function(type) {
        return Object.cast(this, type)
    },
    enumerable: false,
    configurable: true,
    writable: true,
})  

Object.clone = function(obj) {
    return new obj.constructor(obj)
}

Object.deleteUndefinedProperties = function(obj) {
    for (const key in obj)
        if (obj[key] === undefined)
            delete obj[key]
}

Object.propertyEquality = function(obj, other) {
    return Object.keys(obj).every(key => other.hasOwnProperty(key) && obj[key] === other[key])
}

Object.serializationEquality = function(obj, other) {
    return JSON.stringify(obj) === JSON.stringify(other)
}

Object.random = function(obj) {
    return Object.values(obj).random()
}

Object.isNullOrUndefined = value => value === undefined || value === null
Object.isObject = value => typeof value === 'object'
Object.isFunction = value => typeof value === 'function'
Object.isString = value => typeof value === 'string'
Object.isNumber = value => typeof value === 'number'
Object.isDate = value => value instanceof Date

Object.isType = function(obj, type) {
    switch (type) {
        case Function:
            return Object.isFunction(obj)
        case String:
            return Object.isString(obj)
        case Number:
            return Object.isNumber(obj)
    }

    return false
}

Promise.prototype.cast = async function(type) {
    return this.then(result => Object.cast(result, type))
}

String.prototype.toLettersOnly = function() {
    return this.replace(/[^\p{L}]/gu, '')
}

String.prototype.capitalFirst = function() {
    return this && (this[0].toUpperCase() + this.slice(1).toLowerCase())
}

String.prototype.format = function(...values) {
    return this.replace(/{(\d+)}/g, (match, index) => typeof values[index] !== 'undefined' ? values[index] : match)
}

String.prototype.removeNewline = function() {
    return this.replace(/[\r\n]+/g, '')
}

Array.prototype.random = function() {
    return this[Math.floor(Math.random() * this.length)]
}

Array.range = function(length) {
    return Array(length).keys().toArray()
}

Date.max = () => new Date(8640000000000000)
Date.min = () => new Date(-8640000000000000)

Date.prototype.addMilliseconds = function(milliseconds) {
    return new Date(this.getTime() + milliseconds)
}

IncomingMessage.prototype.baseUrl = function(route = '') {
    return `${this.protocol}://${this.get('host')}` + route
}
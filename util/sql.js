import mssql from 'mssql'
import pool from '../config/db.js'
import DbObject, { DbFunction } from '../schema/DbObject.js'

export const createTransaction = () => new mssql.Transaction(pool)
export const createRequest = transaction => new mssql.Request(transaction ?? pool)

mssql.Transaction.prototype.completionEvents = new EventTarget()
mssql.Transaction.prototype.onCommit = function(listener) { this.completionEvents.addEventListener('commit', listener) }
mssql.Transaction.prototype.onRollback = function(listener) { this.completionEvents.addEventListener('rollback', listener) }

mssql.Transaction.prototype.fail = async function() {
    await this.rollback()
    this.failed = this.completed = true
    this.completionEvents.dispatchEvent(new CustomEvent('rollback'))
}

mssql.Transaction.prototype.complete = async function() {
    await this.commit()
    this.completed = true
    this.completionEvents.dispatchEvent(new CustomEvent('commit'))
}

// need to test this
export async function sqlTransaction(operations, parentTransaction) {
    const transaction = parentTransaction ?? createTransaction()
    
    if (!parentTransaction)
        await transaction.begin()

    transaction.result = await operations(transaction).catch(async e => {
        await transaction.fail()
        throw e
    })

    if (!parentTransaction && !transaction.completed)
        await transaction.complete()

    return transaction
}

mssql.Request.prototype.command = ''
mssql.Request.prototype.paramCount = 0

mssql.Request.prototype.run = async function(command = this.command) {
    return this.query(command.removeNewline()).catch(e => {
        e.command = command
        throw e
    })
}

mssql.Request.prototype.any = function() {
    return this.run().then(r => r.recordset.length)
}

mssql.Request.prototype.addParam = function(value) {
    if (value === undefined)
        return ''

    if (value === null)
        return 'NULL'

    if (value instanceof DbFunction)
        return `${value.name}(${this.addParams(value.values)})` + value.getAlias()

    if (value instanceof DbObject)
        return value.name + value.getAlias()

    if (Array.isArray(value))
        return this.addParams(value)

    if (Object.isObject(value) && !Object.isDate(value))
        return this.addList(value)

    const name = this.paramCount++
    this.input(name.toString(), value)
    return '@' + name
}

mssql.Request.prototype.addParams = function(values) {
    return values.map(this.addParam.bind(this)).join()
}

mssql.Request.prototype.addList = function(obj, delimiter = ',') {
    return Object.entries(obj).map(([col, val]) => `${col} = ${this.addParam(val)}`).join(delimiter)
}

mssql.Request.prototype.semicolon = function() {
    this.command += ';'
    return this
}

mssql.Request.prototype.parse = function(strings, ...values) {
    this.command += ' ' + strings.reduce((result, string, i) => result + string + this.addParam(values[i]), '')
    return this
}

mssql.Request.prototype.sql = function(strings, ...values) {
    if (strings !== undefined)
        this.parse(strings, ...values)

    return this.run().then(r => r.recordset)
}

mssql.Request.prototype.insert = function(dbTable, obj) {
    Object.deleteUndefinedProperties(obj)

    return this.sql`
        INSERT INTO ${dbTable}
        (${new DbObject(Object.keys(obj).join())})
        OUTPUT INSERTED.*
        VALUES (${Object.values(obj)})
    `.then(rs => rs[0])
}

// because of this error there cannot be any triggers in the database so they need to be written as a function and
// ran either in dbtable (preferred but adds complexity) or directly in dbtable children
// https://stackoverflow.com/questions/13198476/cannot-use-update-with-output-clause-when-a-trigger-is-on-the-table
mssql.Request.prototype.update = function(dbTable, obj) {
    Object.deleteUndefinedProperties(obj)
    this.parse`UPDATE ${dbTable} SET ${obj}`
    this.parse`OUTPUT DELETED.*`

    return this.sql.bind(this)
}

mssql.Request.prototype.delete = function(table) {
    this.parse`DELETE FROM ${table}`
    this.parse`OUTPUT DELETED.*`
    
    return this.sql.bind(this)
}

mssql.Request.prototype.select = function(dbTable, dbColumns, limit) {
    this.parse`SELECT`
    limit > 0 && this.parse`TOP ${new DbObject(limit)}`

    const columns = dbColumns?.length ? dbColumns : new DbObject('*')
    this.parse`${columns} FROM ${dbTable}`

    return this.sql.bind(this)
}

mssql.Request.prototype.selectFirst = function(dbTable, dbColumns) {
    return (strings, ...values) =>
        this.select(dbTable, dbColumns, 1)(strings, ...values)
            .then(rs => rs[0])
}

mssql.Request.prototype.exists = function(dbTable) {
    return (strings, ...values) =>
        this.selectFirst(dbTable, [new DbObject(1)])(strings, ...values)
            .then(r => !!r?.[''])
}

mssql.Request.prototype.count = function(dbTable) {
    return (strings, ...values) => 
        this.selectFirst(dbTable, [new DbObject('COUNT(*)')])(strings, ...values)
            .then(r => r?.[''])
}

mssql.Request.prototype.selectIds = function(dbTable, limit) {
    return (strings, ...values) =>
        this.select(dbTable, [new DbObject('id')], limit)(strings, ...values)
            .then(rs => rs.flatMap(r => r.id))
}

mssql.Transaction.prototype.sql = function(strings, ...values) { return this.request().sql(strings, ...values) }
mssql.Transaction.prototype.insert = function (table, obj) { return this.request().insert(table, obj) }

export const sql = (strings, ...values) => createRequest().sql(strings, ...values)
export const sqlSelect = (dbTable, dbColumns, limit) => createRequest().select(dbTable, dbColumns, limit)
export const sqlInsert = (table, obj, transaction) => createRequest(transaction).insert(table, obj)
export const sqlUpdate = (table, obj, transaction) => createRequest(transaction).update(table, obj)
export const sqlDelete = (table, transaction) => createRequest(transaction).delete(table)
export const sqlFirst = (dbTable, dbColumns) => createRequest().selectFirst(dbTable, dbColumns)
export const sqlExists = (dbTable) => createRequest().exists(dbTable)
export const sqlCount = dbTable => createRequest().count(dbTable)
export const sqlIds = (dbTable, limit) => createRequest().selectIds(dbTable, limit)
export const sqlMany = (strings, ...values) => sql(strings, ...values).then(rs => rs.flatMap(r => Object.values(r)))
import { TableEventTypes } from "../interface/definitions.js"
import { sqlDelete, sqlFirst, sqlInsert, sqlUpdate } from "../util/sql.js"

export default class DbObject {
    constructor(name) {
        this.name = name
    }

    // not sure how to do this yet
    as(alias) {
        this.alias = alias
        return this
    }

    getAlias() {
        return this.alias ? ` AS ` + this.alias : ''
    }
}

export class DbColumn extends DbObject {
    constructor(name, validation) {
        super(name)
        this.validation = validation
    }

    static id = new DbColumn('id')
}

export class DbTable extends DbObject {
    #events = new EventTarget()

    on(tableEventType, listener) {
        this.#events.addEventListener(tableEventType, ({ detail }) => listener(detail))
    }

    emit(tableEventType, detail, transaction) {
        if (transaction) {
            transaction.onCommit(_ => this.emit(tableEventType, detail))
            return
        }

        this.#events.dispatchEvent(new CustomEvent(tableEventType, { detail }))
        this.#events.dispatchEvent(new CustomEvent(TableEventTypes.Change, { detail: { tableEventType, ...detail } }))
    }

    emitInsert = inserted => this.emit(TableEventTypes.Insert, { inserted })
    emitDelete = deleted => this.emit(TableEventTypes.Delete, { deleted })
    emitUpdate = (deleted, inserted) => this.emit(TableEventTypes.Update, { deleted, inserted })
    onInsert = listener => this.on(TableEventTypes.Insert, listener)
    onDelete = listener => this.on(TableEventTypes.Delete, listener)
    onUpdate = listener => this.on(TableEventTypes.Update, listener)
    onChange = listener => this.on(TableEventTypes.Change, listener)

    async add(obj, transaction) {
        const inserted = await sqlInsert(this, obj, transaction)
        this.emitInsert(inserted)
        return inserted
    }

    async getId(id) {
        if (id === undefined)
            return undefined

        return sqlFirst(this)`WHERE ${this.id} = ${id}`
    }

    // database events are only emitted in this class
    // but it could instead be sqlDelete(dbTable) -> dbTable.emit(deletedArray)
    async deleteId({ id }, transaction) {
        const deleted = (await sqlDelete(this, transaction)`WHERE ${this.id} = ${id}`)[0]
        deleted && this.emitDelete(deleted)
        return deleted
    }

    async updateId({ id }, updates, transaction) {
        const deleted = (await sqlUpdate(this, updates, transaction)`WHERE ${this.id} = ${id}`)[0]
        deleted && this.emitUpdate(deleted, updates)
        return deleted
    }

    async updateColumnId({ id }, dbColumn, value, transaction) {
        await this.updateId({ id }, { [dbColumn.name]: value }, transaction)
    }

    getColumns(...except) {
        return Object.values(this).filter(v => v instanceof DbColumn && !except.includes(v))
    }

    getAbbreviatedColumns() {
        return this.getColumns()
    }

    static deleted = new DbTable('@DeletedRows')
}

export class DbFunction extends DbObject {
    constructor(name, ...values) {
        super(name)
        this.values = values
    }
}
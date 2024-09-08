import { createRequest, sqlInsert } from "../util/sql.js";
import { DbColumn, DbTable } from "./DbObject.js";
import { RelationshipTypes } from "../interface/definitions.js";

class Relationships extends DbTable {
    constructor() {
        super('relationships')
    }

    id = new DbColumn('id')
    parent_id = new DbColumn('parent_id')
    child_id = new DbColumn('child_id')
    type = new DbColumn('type')

    async exists(parent, child, ...types) {
        const request = createRequest()
        request.parse`SELECT 1 FROM ${this}`
        request.parse`WHERE ${this.parent_id} = ${parent.id} AND ${this.child_id} = ${child.id}`

        if (types?.length)
            request.parse`AND ${this.type} IN (${types})`

        return request.any()
    }

    async add(parent, child, type = RelationshipTypes.Owner, transaction) {
        if (parent.id !== child.id && !await this.exists(parent, child))
            return sqlInsert(this, { parent_id: parent.id, child_id: child.id, type }, transaction)
    }
}

const relationships = new Relationships()
export default relationships
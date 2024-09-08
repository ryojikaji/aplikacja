import User from '../models/User.js'
import { sql, sqlExists, sqlFirst } from '../util/sql.js'
import { DbTable, DbColumn } from './DbObject.js'

class Users extends DbTable {
    constructor() {
        super('users')
    }

    id = new DbColumn('id')
    role = new DbColumn('role')
    created_at = new DbColumn('created_at')
    email = new DbColumn('email')
    password = new DbColumn('password')
    first_name = new DbColumn('first_name')
    last_name = new DbColumn('last_name')
    access_token = new DbColumn('access_token')
    verified = new DbColumn('verified')
    verification_token = new DbColumn('verification_token')
    fcm_token = new DbColumn('fcm_token')

    minInfo() {
        return [ this.id, this.role, this.email, this.first_name, this.last_name ]
    }

    async getId(id) {
        return super.getId(id)?.convert(User.getType)
    }

    async getByEmail(email) {
        if (email === undefined)
            return undefined

        return sqlFirst(this)`WHERE ${this.email} = ${email}`.convert(User.getType)
    }

    async getByVerificationToken(token) {
        if (token === undefined)
            return undefined

        return sqlFirst(this)`WHERE ${this.verification_token} = ${token}`.convert(User.getType)
    }

    async emailExists(email) {
        return sqlExists(this)`WHERE ${this.email} = ${email}`
    }

    async deleteId({ id }, transaction) {
        // this is a workaround using a trigger procedure but ideally the deleted records would be emitted (using function)
        // also im not sure how to use a transaction here
        return sql`EXEC DeleteUser @UserId = ${id}`
    }
}

const users = new Users()
export default users
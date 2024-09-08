import { fakerPL as faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import transporter from '../config/mail.js'
import { Genders } from '../interface/definitions.js'
import strings from '../resources/strings.en.js'
import dbAccessTokens, { AccessToken } from '../schema/AccessTokens.js'
import { getEvents, getParents, getChildren } from '../schema/functions.js'
import dbRelationships from '../schema/Relationships.js'
import dbUsers from '../schema/Users.js'
import { ArgumentError } from '../util/errors.js'
import { sql, sqlInsert, sqlSelect } from '../util/sql.js'
import Model from './Model.js'

export default class User extends Model {
    constructor({ id, role, created_at, email, password, first_name, last_name, gender, birth_date, phone_number, verification_token, verified, height_cm, weight_kg, fcm_token }) {
        // todo convert createdat to js datetime
        super({ id, role, created_at, email, password, first_name, last_name, gender, birth_date, phone_number, verification_token, verified, height_cm, weight_kg, fcm_token })
    }

    static getTable() { return dbUsers }

    static async authenticate(token) {
        const accessToken = await AccessToken.verify(token)
        
        if (!accessToken)
            return

        const tokenHash = AccessToken.hash(token)

        if (!await dbAccessTokens.get(accessToken.id, tokenHash))
            return

        const user = User.from(accessToken)
        user.tokenHash = tokenHash
        return user
    }

    async generateAccessToken() {
        const accessToken = new AccessToken(this)
        const signed = accessToken.sign()
        await sqlInsert(dbAccessTokens, { user_id: this.id, hash: AccessToken.hash(signed) })
        return signed
    }

    static async login({ email, password }) {
        if (!email || !password)
            return

        const user = await dbUsers.getByEmail(email)

        if (!user?.verified || !await bcrypt.compare(password, user.password))
            return
    
        return user.generateAccessToken()
    }

    async logout() {
        await dbAccessTokens.delete(this.id, this.tokenHash)
        delete this.tokenHash
    }

    async logoutAll() {
        await dbAccessTokens.deleteForUser(this)
        delete this.tokenHash
    }

    async sendVerificationEmail() {
        if (this.verified)
            return

        const verification_token = crypto.randomBytes(20).toString('hex')
        await this.updateColumn(dbUsers.verification_token, verification_token)

        const mailOptions = {
            to: this.email,
            subject: strings.verificationSubject,
            html: strings.verificationHtmlBody.format(process.env.WEBSITE, verification_token)
        }

        return transporter.sendMail(mailOptions)
    }

    static async verify(token) {
        if (!token)
            return false

        const user = dbUsers.getByVerificationToken(token)

        if (user === undefined)
            return false

        if (user.verified)
            return true

        await sqlUpdate(dbUsers, { [dbUsers.verified.name]: 1 })`WHERE ${dbUsers.verification_token} = ${token}`
        return true
    }

    full_name() {
        return `${this.first_name} ${this.last_name}`
    }
    
    getInfo() {
        const user = this.clone()
        delete user.password
        delete user.verification_token
        delete user.verified
        delete user.tokenHash
        delete user.fcm_token
        return user
    }

    async getUpdateModel() {
        const user = await super.getUpdateModel()
        delete user.id
        delete user.created_at
        delete user.verified
        delete user.verification_token
        delete user.tokenHash
        delete user.fcm_token

        if (user.password)
            user.password = await bcrypt.hash(user.password, 10)

        user.first_name = user.first_name?.toLettersOnly().capitalFirst()
        user.last_name = user.last_name?.toLettersOnly().capitalFirst()
        return user
    }

    static fake() {
        const gender = Genders.random()
        const sexType = gender === Genders.Female ? 'female' : 'male'

        return new this.prototype.constructor({
            gender,
            first_name: faker.person.firstName(sexType),
            last_name: faker.person.lastName(sexType),
            email: faker.internet.email(),
            password: faker.internet.password(),
            phone_number: faker.phone.number(),
            birth_date: faker.date.birthdate(),
            height_cm: faker.number.int(140, 210),
            weight_kg: faker.number.int(40, 200),
        })
    }

    async sendFCM(fcm) {
        if (this.fcm_token)
            return fcm.data({ userId: this.id }).sendGetId(this.fcm_token)
    }

    async getParents(minimal = false, ...relationshipTypes) {
        return sqlSelect(getParents(this.id, relationshipTypes), minimal ? dbUsers.minInfo() : [])()
    }

    async getChildren(...relationshipTypes) {
        return sql`SELECT ${dbUsers.minInfo()} FROM ${getChildren(this.id, relationshipTypes)}`
    }

    async addParent(parent, relationshipType, transaction) {
        if (parent instanceof User === false)
            throw new ArgumentError()

        return dbRelationships.add(parent, this, relationshipType, transaction)
    }

    async addChild(child, relationshipType, transaction) {
        return dbRelationships.add(this, child, relationshipType, transaction)
    }

    async isParentOf(child, ...relationshipTypes) {
        return dbRelationships.exists(this, child, ...relationshipTypes)
    }

    async isChildOf(parent, ...relationshipTypes) {
        return dbRelationships.exists(parent, this, ...relationshipTypes)
    }

    async getReceivedEvents({ giverId, type, state }) {
        return sql`SELECT * FROM ${getEvents({ receiverId: this.id, giverId, type, state})}`
    }

    async getGivenEvents({ receiverId, type, state }) {
        return sql`SELECT * FROM ${getEvents({ giverId: this.id, receiverId, type, state })}`
    }

    async addEventFor(receiver, event) {
        event.giver_id = this.id
        event.receiver_id = receiver.id
        return event.add()
    }
}
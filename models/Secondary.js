import dbUsers from '../schema/Users.js'
import { Roles } from '../interface/definitions.js'
import { User } from './users.js'

export default class Secondary extends User {
    role = Roles.Secondary

    async getUpdateModel() {
        const model = super.getUpdateModel()
        delete model.email
        delete model.password
        delete model.verification_token
        model.first_name = model.first_name?.toLettersOnly().capitalFirst()
        model.last_name = model.last_name?.toLettersOnly().capitalFirst()
        model.role = Roles.Secondary
        model.verified = true

        return model
    }
}
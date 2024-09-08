import { EventStates, EventTypes } from '../interface/definitions.js'
import dbEvents from '../schema/Events.js'
import Model from './Model.js'

export default class Event extends Model {
    state = EventStates.Pending
    
    static getTable() { return dbEvents }
    
    constructor({ id, type, state, giver_id, receiver_id, info, modified_at, start_date, duration_seconds, interval_seconds }) {
        super({ id, type, state, giver_id, receiver_id, info, modified_at, start_date, duration_seconds, interval_seconds })
    }

    // this i think for now should be like in User so validate the input (for example valid type) and return result
    async getUpdateModel() {
        const model = this.clone()
        delete model.id
        delete model.modified_at

        return model
    }

    async getInsertModel() {
        const model = this.clone()
        model.state = EventStates.Pending
        delete model.id
        delete model.modified_at

        return model
    }
}
import { fakerPL as faker } from '@faker-js/faker'
import { EventTypes, TaskTypes } from "../interface/definitions.js";
import Event from "./Event.js";

// might need to add different task types later but that shouldnt be aproblem
export default class Task extends Event {
    type = EventTypes.Task

    async getUpdateModel() {
        const model = await super.getUpdateModel()

        return model
    }

    static everyMinute() {
        return new this.prototype.constructor({
            info: faker.commerce.productDescription(),
            start_date: new Date().addMilliseconds(60 * 1000),
            duration_seconds: 30,
            interval_seconds: 60,
        })
    }
}

export class TestTask extends Task {
    type = TaskTypes.Test
}
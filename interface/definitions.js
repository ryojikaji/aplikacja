export class Definition {
    static random() {
        return Object.random(this)
    }

    static values(...except) {
        return Object.values(this).filter(v => !except.includes(v))
    }

    static isValid(value) {
        return this.values().includes(value)
    }
}

export class Roles extends Definition {
    static Primary = 1
    static Secondary = 2
}

export class Genders extends Definition {
    static Male = 0
    static Female = 1
}

export class EventTypes extends Definition {
    static Alert = 100
    static Activity = 200
    static Message = 400
    static Task = 500
}

export class RelationshipTypes extends Definition {
    static Carer = 0
    static Owner = 1
    static Friend = 2
}

export class IncomingMessageType extends EventTypes {
    static Error = -1
}

export class OutgoingMessageType extends EventTypes {
    static Error = -1
    static Ready = 0
}

export class TableEventTypes extends Definition {
    static Change = 1
    static Insert = 2
    static Update = 3
    static Delete = 4
}

export class EventStates extends Definition {
    static Pending = 1
    static Ongoing = 2
    static Completed = 3
    static Missed = 4
}

export class TaskTypes extends Definition {
    static Task = EventTypes.Task
    static Test = EventTypes.Task + 1
}
// define server sent message types for http and fcm and ws

import FirebaseCloudMessage from "../firebase/FirebaseCloudMessage.js"

export class ServerMessage extends FirebaseCloudMessage {
    constructor(type, fields = {}) {
        super()
        this.data({ type, ...fields })
    }
}

export class TaskStateMessage extends ServerMessage {
    static type = 1

    constructor(task) {
        super(TaskStateMessage.type, { task })
    }
}

export class TaskUpdateMessage extends ServerMessage {
    static type = 2

    constructor(taskId, newTask) {
        super(TaskUpdateMessage.type, { taskId, newTask })
    }
}
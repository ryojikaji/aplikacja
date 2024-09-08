import { TaskStateMessage, TaskUpdateMessage } from "../interface/ServerMessage.js"
import User from "../models/User.js"
import { authActions } from "../routes/auth.js"
import { eventActions } from "../routes/event.js"
import { fcmActions } from "../routes/fcm.js"
import { userActions } from '../routes/user.js'
import UserMessageService from "../services/UserMessageService.js"
import { assert } from "../util/helpers.js"

export default class Client extends User {
    parents = {}
    children = {}
    tasks = {}
    
    static async create(role, parent) {
        const user = User.getType({ role }).fake()

        user.id = await userActions.postUsers(parent?.accessToken, user).then(r => {
            assert(r.ok)
            return r.json()
        })

        const client = user.cast(Client)
        client.owner = parent
        UserMessageService.onConfirmed(user.id, client.processFCM.bind(client))
        return client
    }

    async login() {
        this.accessToken = await authActions.login(this).then(r => {
            assert(r.ok)
            return r.text()
        })

        await fcmActions.putToken(this.accessToken, process.env.FCM_DEFAULT).then(r => assert(r.ok))
    }

    async logout() {
        await authActions.logout(this.accessToken).then(r => assert(r.ok))
    }

    async createChild(role) {
        const client = await Client.create(role, this)
        const tokenResponse = await userActions.getToken(this.accessToken, client.id)
        assert(tokenResponse.ok)
        client.accessToken = await tokenResponse.text()
        this.children[client.id] = client
        return client
    }

    async addChild(client, relationshipType) {
        await relatedActions.postParents(this.accessToken, client.id, client.accessToken, relationshipType).then(r => assert(r.ok))
        client.parents[this.id] = this
        this.children.push(client)
    }

    async addTaskFor(client, task) {
        task.id = await eventActions.postEvents(this.accessToken, client.id, task).then(r => {
            assert(r.ok)
            return r.json()
        })

        client.tasks[task.id] = task
        const getResponse = await eventActions.getEvent(this.accessToken, client.id, task.id)
        assert(getResponse.ok)
        return getResponse.json()
    }

    processFCM(serverMessage) {
        return {
            [TaskStateMessage.type]: this.processTaskStatusMessage,
            [TaskUpdateMessage.type]: this.processTaskUpdateMessage,
        }[serverMessage.type]?.(serverMessage)
    }

    // couldnt these two things be like the same?
    processTaskStatusMessage(serverMessage) {
        console.log('task state update', serverMessage)
    }

    processTaskUpdateMessage(serverMessage) {
        console.log('task update', serverMessage)
    }
}
import { WebSocketServer } from "ws"
import httpServer from "./http.js"
import User from "./models/User.js"
import { EventTypes, OutgoingMessageType } from "./interface/definitions.js"
import { getBearer } from "./util/helpers.js"

const server = new WebSocketServer({ server: httpServer })
const users = {}

function error(e) {
    // would be nice to manually send an error message to client
    debugger
}

const asyncHandler = fn => (ws, req) => Promise.resolve(fn(ws, req)).catch(error)

server.on('connection', asyncHandler(async (ws, req) => {
    const user = await User.authenticate(getBearer(req))

    if (!user)
        return

    users[user.id] = user

    ws.on('message', message => {
        try {
            const { type, data } = JSON.parse(message)

            switch (type) {
                case undefined:
                    return
                case EventTypes.Alert:
                    console.log('alert')
                    ws.send(JSON.stringify({ type: 400, data: 'abcdef' }))
            }
        } catch (e) {
            console.log(e)
        }
    })

    ws.on('error', error)
    ws.send(JSON.stringify({ type: OutgoingMessageType.Ready }))
}))


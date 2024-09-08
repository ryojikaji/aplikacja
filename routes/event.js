import express from 'express'
import { query } from 'express-validator'
import { EventStates, EventTypes, RelationshipTypes, TaskTypes } from '../interface/definitions.js'
import { authenticate, getModel, getTargetUser, related } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import dbEvents from '../schema/Events.js'
import { asyncHandler } from "../middleware/asyncHandler.js"
import { HttpStatus, HttpRequest } from '../util/http.js'
import { ApiRoutes } from './api.js'
import { UserRoutes } from './user.js'
import Event from '../models/Event.js'
const router = express.Router()

export class EventRoutes {
    static event = (userId, eventId = ':eventId') => UserRoutes.user(userId) + '/event/' + eventId
    static events = userId => UserRoutes.user(userId) + '/events'
    static tasks = userId => UserRoutes.user(userId) + '/tasks'
    static upcomingTasks = userId => this.tasks(userId) + '/upcoming'
    static missedTasks = userId => this.tasks(userId) + '/missed'
}

export class Parameters {
    static get eventId() { return 'eventId' }
    static get giverId() { return 'giverId' }
    static get receiverId() { return 'receiverId' }
    static get type() { return 'type' }
    static get state() { return 'state' }
    static get startBefore() { return 'startBefore' }
    static get startAfter() { return 'startAfter' }
}

router.post(EventRoutes.events(), related(false, false, RelationshipTypes.Carer, RelationshipTypes.Owner), asyncHandler(async (req, res) => {
    const { id } = await req.user.addEventFor(req.targetUser, Event.from(req.body))
    res.status(HttpStatus.Created).location(EventRoutes.event(req.targetUser.id, id)).send(id.toString())
}))

const postEvents = (accessToken, userId, event) => new HttpRequest(ApiRoutes.events(userId)).bearer(accessToken).json(event).post()

router.get(EventRoutes.event(), related(true, false, RelationshipTypes.Carer, RelationshipTypes.Owner), asyncHandler(async (req, res) => {
    const event = await dbEvents.getId(req.params.eventId)
    return event ? res.send(event) : res.send(HttpStatus.NotFound)
}))

const getEvent = (accessToken, userId, eventId) => new HttpRequest(ApiRoutes.event(userId, eventId)).bearer(accessToken).fetch()

// with getmodel no need for including userId in the route, actually would be easier for the client to go without it
router.put(EventRoutes.event(), authenticate, getModel(Event, Parameters.eventId, ({ content, user }) => content.giver_id === user.id), asyncHandler(async (req, res) => {
    await req.content.update(req.body)
    res.send()
}))

const putEvent = (accessToken, userId, eventId, newEvent) => new HttpRequest(ApiRoutes.event(userId, eventId)).bearer(accessToken).json(newEvent).put()

router.get(
    EventRoutes.upcomingTasks(),
    validate(
        query(Parameters.giverId + '.*').toInt(),
        query(Parameters.startBefore).optional().toDate(),
        query(Parameters.startAfter).optional().toDate(),
    ),
    related(true, false, RelationshipTypes.Carer, RelationshipTypes.Owner),
    asyncHandler(async (req, res) => {
        const query = {
            receiverId: req.targetUser.id,
            giverId: req.query[Parameters.giverId],
            startBefore: req.query[Parameters.startBefore],
            startAfter: req.query[Parameters.startAfter],
            type: TaskTypes.values(),
            state: EventStates.Pending,
        }

        res.send(await dbEvents.query(query))
    })
)

const getUpcomingTasks = (accessToken, userId, { giverId, startBefore, startAfter } = {}) => 
    new HttpRequest(ApiRoutes.upcomingTasks(userId))
        .bearer(accessToken)
        .query(Parameters.giverId, giverId)
        .query(Parameters.startBefore, startBefore)
        .query(Parameters.startAfter, startAfter)
        .fetch()

router.get(
    EventRoutes.missedTasks(),
    validate(query(Parameters.giverId + '.*').toInt()),
    related(true, false, RelationshipTypes.Carer, RelationshipTypes.Owner),
    asyncHandler(async (req, res) => {
        const query = {
            receiverId: req.targetUser.id,
            giverId: req.query[Parameters.giverId],
            type: TaskTypes.values(),
            state: EventStates.Missed
        }

        res.send(await dbEvents.query(query))
    })
)

const getMissedTasks = (accessToken, userId, giverId) =>
    new HttpRequest(ApiRoutes.missedTasks(userId))
        .bearer(accessToken)
        .query(Parameters.giverId, giverId)
        .fetch()

export const eventActions = { postEvents, getEvent, putEvent, getUpcomingTasks, getMissedTasks }
export default router
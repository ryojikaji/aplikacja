import express from 'express'
import { body, query } from 'express-validator'
import FirebaseCloudMessage from '../firebase/FirebaseCloudMessage.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import dbUsers from '../schema/Users.js'
import { HttpRequest, HttpStatus } from '../util/http.js'
import { ApiRoutes } from './api.js'
import { sqlExists } from '../util/sql.js'
import UserMessageService from '../services/UserMessageService.js'
const router = express.Router()

export class FCMRoutes {
    static get fcm() { return '/fcm' }
    static get send() { return this.fcm + '/send' }
    static get confirm() { return this.fcm + '/confirm' }
    static get token() { return this.fcm + '/token' }
}

router.post(FCMRoutes.send, validate(query('token').notEmpty(), body().isObject()), asyncHandler(async (req, res) => {
    const response = await new FirebaseCloudMessage().data(req.body).send(req.query.token)
    res.send(response.status)
}))

const send = (accessToken, messageObject) => new HttpRequest(ApiRoutes.sendFCM).bearer(accessToken).json(messageObject).post()

router.post(FCMRoutes.confirm, validate(body().isObject()), asyncHandler(async (req, res) => {
    UserMessageService.confirm(req.body)
    res.send()
}))

const confirm = (accessToken, messageObject) => new HttpRequest(ApiRoutes.confirmFCM).bearer(accessToken).json(messageObject).post()

router.put(FCMRoutes.token, validate(body().notEmpty()), authenticate, asyncHandler(async (req, res) => {
    if (!process.env.DEBUG && await sqlExists(dbUsers)`WHERE ${dbUsers.fcm_token} = ${req.body}`)
        return res.send(HttpStatus.Conflict)

    await req.user.updateColumn(dbUsers.fcm_token, req.body)
    res.send()
}))

const putToken = (accessToken, fcmToken) => new HttpRequest(ApiRoutes.fcmToken).bearer(accessToken).text(fcmToken).put()

export const fcmActions = { send, confirm, putToken }
export default router
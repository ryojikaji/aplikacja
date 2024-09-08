import express from 'express'
import QRCode from 'qrcode'
import { RelationshipTypes } from '../interface/definitions.js'
import { asyncHandler } from "../middleware/asyncHandler.js"
import { currentUserPlaceholder, getCurrentUser, related } from '../middleware/auth.js'
import User from '../models/User.js'
import { HttpRequest, HttpStatus } from '../util/http.js'
import { sqlTransaction } from '../util/sql.js'
import { ApiRoutes } from './api.js'
const router = express.Router()

export class UserRoutes {
    static users = '/users'
    static user = (userId = ':userId') => '/user/' + userId
    static get currentUser() { return this.user(currentUserPlaceholder) }
    static qr = userId => this.user(userId) + '/qr'
    static token = userId => this.user(userId) + '/token'
    static logoutAll = userId => this.user(userId) + '/logoutAll'
}

router.post(UserRoutes.users, getCurrentUser, asyncHandler(async (req, res) => {
    const { result } = await sqlTransaction(async t => {
        const targetUser = await User.from(req.body).add(t)
        await targetUser.addParent(req.user, RelationshipTypes.Owner, t)
        
        return targetUser
    })

    if (!result)
        return res.send(HttpStatus.ServerError)
    
    res.status(HttpStatus.Created).location(UserRoutes.user(result.id)).send(result.id + '')
}))

const postUsers = (accessToken, user) => new HttpRequest(ApiRoutes.users).bearer(accessToken).json(user).post()

router.get(UserRoutes.token(), related(false, false, RelationshipTypes.Owner), asyncHandler(async (req, res) => {
    res.send(await req.targetUser.generateAccessToken())
}))

const getToken = (accessToken, userId = currentUserPlaceholder) => new HttpRequest(ApiRoutes.token(userId)).bearer(accessToken).fetch()

router.get(UserRoutes.qr(), related(false, false, RelationshipTypes.Owner), asyncHandler(async (req, res) => {
    res.send(await QRCode.toDataURL(await req.targetUser.generateAccessToken()))
}))

const getQr = (accessToken, userId = currentUserPlaceholder) => new HttpRequest(ApiRoutes.qr(userId)).bearer(accessToken).fetch()

router.get(UserRoutes.user(), related(true, true, RelationshipTypes.Owner, RelationshipTypes.Carer), asyncHandler(async (req, res) => {
    res.json(req.targetUser.getInfo())
}))

const getUser = (accessToken, userId = currentUserPlaceholder) => new HttpRequest(ApiRoutes.user(userId)).bearer(accessToken).fetch()

router.delete(UserRoutes.user(), related(true, false, RelationshipTypes.Owner), asyncHandler(async (req, res) => {
    await req.targetUser.delete()
    res.send()
}))

const deleteUser = (accessToken, userId = currentUserPlaceholder) => new HttpRequest(ApiRoutes.user(userId)).bearer(accessToken).delete()

router.get(UserRoutes.logoutAll(), related(true, false, RelationshipTypes.Owner), asyncHandler(async (req, res) => {
    await req.targetUser.logoutAll()
    res.send()
}))

const logoutAll = (accessToken, userId = currentUserPlaceholder) => new HttpRequest(ApiRoutes.logoutAll(userId)).bearer(accessToken).fetch()

export const userActions = { postUsers, getToken, getUser, deleteUser, logoutAll }
export default router

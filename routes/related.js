import express from 'express'
import { UserRoutes } from './user.js'
import { authenticate, disallowSelf, getTargetUser, related } from '../middleware/auth.js'
import { asyncHandler } from "../middleware/asyncHandler.js"
import { validate } from '../middleware/validate.js'
import { body, query } from 'express-validator'
import { HttpRequest, HttpStatus } from '../util/http.js'
import { ApiRoutes } from './api.js'
import { RelationshipTypes } from '../interface/definitions.js'
import User from '../models/User.js'
const router = express.Router()

export class RelatedRoutes {
    static related = userId => UserRoutes.user(userId) + '/related'
    static parents = userId => this.related(userId) + '/parents'
    static children = userId => this.related(userId) + '/children'
}

class Validations {
    static types = (...except) => query('type.*').isIn(RelationshipTypes.values(...except))
    static type = (...except) => query('type').isIn(RelationshipTypes.values(...except))
}

router.get(
    RelatedRoutes.parents(), 
    validate(Validations.types()),
    related(true, false, RelationshipTypes.Owner), 
    asyncHandler(async (req, res) => res.send(await req.targetUser.getParents(req.query.type)))
)

const getParents = (accessToken, userId, ...types) => 
    new HttpRequest(ApiRoutes.parents(userId))
        .bearer(accessToken)
        .query('type', types)
        .fetch()


router.post(
    RelatedRoutes.parents(),
    validate(Validations.type(RelationshipTypes.Owner), body().isJWT()),
    authenticate,
    getTargetUser,
    disallowSelf,
    asyncHandler(async (req, res) => {
        const child = await User.authenticate(req.body)

        if (child?.id !== req.targetUser.id)
            return res.send(HttpStatus.NotFound)

        await child.addParent(req.user, req.query.type)
        res.send()
    })
)

const postParents = (accessToken, userId, childAccessToken, type) =>
    new HttpRequest(ApiRoutes.parents(userId))
        .bearer(accessToken)
        .text(childAccessToken)
        .query('type', type)
        .post()

router.get(
    RelatedRoutes.children(),
    validate(Validations.types()),
    related(true, false, RelationshipTypes.Owner),
    asyncHandler(async (req, res) => res.send(await req.targetUser.getChildren(req.query.type)))
)

const getChildren = (accessToken, userId, ...types) =>
    new HttpRequest(ApiRoutes.children(userId))
        .bearer(accessToken)
        .query('type', types)
        .fetch()

export const relatedActions = { getParents, postParents, getChildren }
export default router
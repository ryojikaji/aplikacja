import express from 'express'
import { body, query } from 'express-validator'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authenticate } from '../middleware/auth.js'
import { debounceMinutes } from '../middleware/debounce.js'
import eventStream from '../middleware/eventStream.js'
import User from '../models/User.js'
import { HttpRequest, HttpStatus } from '../util/http.js'
import { ApiRoutes } from './api.js'
const router = express.Router()

export class VerificationRoutes {
    static get verification() { return '/verification' }
    static get send() { return this.verification + '/send' }
}

router.get(VerificationRoutes.send, debounceMinutes(5), authenticate, asyncHandler(async (req, res) => {
    await req.user.sendVerificationEmail()
    res.send()
}))

export const sendVerification = accessToken => new HttpRequest(ApiRoutes.sendVerification).bearer(accessToken).fetch()

router.post(VerificationRoutes.verification, body().isString(), asyncHandler(async (req, res) => {
    res.send(await User.verify(req.body) ? HttpStatus.Ok : HttpStatus.Unauthorized)
}))

export const postVerification = verificationToken => new HttpRequest(ApiRoutes.verification).text(verificationToken).post()

router.get(VerificationRoutes.verification, query('token').notEmpty(), eventStream, asyncHandler(async (req, res) => {
    res.write(strings.verifying + '\n')

    await new Promise(r => setTimeout(r, 2500))
    const response = await new HttpRequest(ApiRoutes.verification).text(req.query.token).post()
    const message = response.ok ? strings.verificationSuccess : strings.verificationFailure

    res.write(message)
    res.end()
}))

export default router
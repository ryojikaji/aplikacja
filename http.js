import express from 'express'
import http from 'http'
import mssql from 'mssql'

import authRoutes from './routes/auth.js'
import eventRoutes from './routes/event.js'
import apiRoutes, { ApiRoutes } from './routes/api.js'
import userRoutes from './routes/user.js'
import relatedRoutes from './routes/related.js'
import verificationRoutes from './routes/verification.js'
import fcmRoutes from './routes/fcm.js'
import { ArgumentError } from './util/errors.js'
import { HttpStatus } from './util/http.js'

const app = express()
app.use(express.json())
app.use(express.text())
app.use(express.static('public'))

app.use(ApiRoutes.api, apiRoutes)
app.use(ApiRoutes.api, authRoutes)
app.use(ApiRoutes.api, userRoutes)
app.use(ApiRoutes.api, eventRoutes)
app.use(ApiRoutes.api, relatedRoutes)
app.use(ApiRoutes.api, verificationRoutes)
app.use(ApiRoutes.api, fcmRoutes)

app.use((err, req, res, next) => {
    console.error(err)

    if (err instanceof ArgumentError) {
        res.status(err.status ?? HttpStatus.BadRequest)
        res.send(err.message)
        return
    }

    if (err instanceof mssql.RequestError)
        console.error('query: ' + err.command)

    res.send(HttpStatus.ServerError)
})

app.use((req, res, next) => res.send(HttpStatus.NotFound))

const server = http.createServer(app)
export default server
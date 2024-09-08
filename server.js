import 'dotenv/config'
import httpServer from './http.js'
import './util/conversions.js'
import './util/extensions.js'
import './ws.js'
// import { setupUserTest } from './tests/fcm.mjs'
import { fakerPL as faker } from '@faker-js/faker'
import { Roles } from './interface/definitions.js'
import Task from './models/Task.js'
import { eventActions } from './routes/event.js'
import UserMessageService from './services/UserMessageService.js'
import Client from './tests/Client.mjs'
import { assert } from './util/helpers.js'
import Primary from './models/Primary.js'

const port = process.env.PORT || 3000
const userMessageService = new UserMessageService()
// const taskService = new PollingTaskService()

httpServer.listen(port, async () => {
    console.log(`Server running on port ${port}`)

    const primary = await Client.create(Roles.Primary)
    await primary.login()
    const secondary = await primary.createChild(Roles.Secondary)
    const task = await primary.addTaskFor(secondary, Task.everyMinute())

    console.log(task)

    await new Promise(r => setTimeout(r, 2500))

    task.info = faker.company.catchPhrase()
    await eventActions.putEvent(primary.accessToken, secondary.id, task.id, task).then(r => assert(r.ok))

    await new Promise(r => setTimeout(r, 2500))
    console.log(UserMessageService.unconfirmed)
})
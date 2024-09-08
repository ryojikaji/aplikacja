import serviceAccount from './serviceAccount.json' with { type: 'json' }
import { GoogleAuth } from 'google-auth-library'
import { HttpRequest } from '../util/http.js'

export default class FirebaseCloudMessage {
    static accessToken = this.getAccessToken()
    static endpoint = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`

    static async getAccessToken() {
        const auth = new GoogleAuth({ 
            credentials: serviceAccount, // needs to be a valid google cloud console IAM created service account json file
            scopes: [ 'https://www.googleapis.com/auth/cloud-platform' ]
        })
    
        const client = await auth.getClient()
        return client.getAccessToken().then(r => r.token)
    }

    message = { }

    // https://firebase.google.com/docs/cloud-messaging/migrate-v1#update-the-payload-of-send-requests
    static stringify(obj) {
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : (v?.toString() ?? '')]))
    }

    static unstringify(obj) {
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => {
            let nv = v
            try { nv = JSON.parse(nv) } catch {}
            return [k, nv]
        }))
    }

    data(obj) {
        this.message.data = Object.assign({}, this.message.data ?? {}, FirebaseCloudMessage.stringify(obj))
        return this
    }

    notification(title, body, click_action) {
        this.message.notification = { title, body }

        if (click_action)
            this.message.notification.click_action = click_action

        return this
    }

    async send(token) {
        return new HttpRequest(FirebaseCloudMessage.endpoint)
            .body(JSON.stringify({ message: { token, ...this.message} }), 'application/json')
            .bearer(await FirebaseCloudMessage.accessToken)
            .post()
    }

    async sendGetId(token) {
        const response = await this.send(token)
        
        if (response.ok)
            return response.json().then(r => r.name.split('/').at(-1))
    }
}
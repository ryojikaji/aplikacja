importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js')
// import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js'
// import { getMessaging } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging.js'

firebase.initializeApp({
    apiKey: 'AIzaSyDXK9ntNlAO06WLV2r4oJoneKyJxuCaXhQ',
    authDomain: 'zwardon-12120.firebaseapp.com',
    projectId: 'zwardon-12120',
    storageBucket: 'zwardon-12120.appspot.com',
    messagingSenderId: '784564826365',
    appId: '1:784564826365:web:416361d6933884a0208e94'
})

const messaging = firebase.messaging()
const fcmConfirmEndpoint = '/api/fcm/confirm'

messaging.onBackgroundMessage(payload => {
    console.log('background notification', payload)

    fetch(fcmConfirmEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
})
/* Firebase Messaging background service worker. */
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
    apiKey: 'AIzaSyCwJqwCtGTo-EPJHqEww6vvVX3NWx4t1k',
    authDomain: 'ner-shield-sih26002.firebaseapp.com',
    projectId: 'ner-shield-sih26002',
    storageBucket: 'ner-shield-sih26002.firebasestorage.app',
    messagingSenderId: '115667038694',
    appId: '1:115667038694:web:8d819892b1811572ffe627',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'NER-SHIELD Alert'
    const options = {
        body: payload.notification?.body || 'A new operational alert is available.',
        icon: '/favicon.svg',
        data: payload.data || {},
    }

    self.registration.showNotification(title, options)
})
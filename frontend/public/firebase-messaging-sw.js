/* Firebase Messaging background service worker.
 * The deployment may provide this config at runtime; no Firebase values are
 * committed to the repository.
 */
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

let messaging = null

function configure(config) {
    if (messaging || !config || !Object.values(config).every(Boolean)) return
    firebase.initializeApp(config)
    messaging = firebase.messaging()
    messaging.onBackgroundMessage((payload) => {
        const title = payload.notification?.title || 'NER-SHIELD Alert'
        self.registration.showNotification(title, {
            body: payload.notification?.body || 'A new operational alert is available.',
            icon: '/favicon.svg',
            data: payload.data || {},
        })
    })
}

self.addEventListener('message', (event) => {
    if (event.data?.type === 'configure') configure(event.data.config)
})

configure(self.NER_SHIELD_FIREBASE_CONFIG)
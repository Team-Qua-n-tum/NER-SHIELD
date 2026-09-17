import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean)

export const firebaseApp = hasFirebaseConfig ? initializeApp(firebaseConfig) : null

let messagingInstance = null

async function getMessagingInstance() {
    if (messagingInstance || !firebaseApp || typeof window === 'undefined') return messagingInstance
    if (!(await isSupported())) return null

    messagingInstance = getMessaging(firebaseApp)
    return messagingInstance
}

export async function requestNotificationPermission() {
    if (
        typeof window === 'undefined' ||
        !('Notification' in window) ||
        !('serviceWorker' in navigator)
    ) return null

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const messaging = await getMessagingInstance()
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    if (!messaging || !vapidKey) return null

    const serviceWorkerRegistration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
    )

    return getToken(messaging, { vapidKey, serviceWorkerRegistration })
}

export async function subscribeToForegroundMessages(callback) {
    const messaging = await getMessagingInstance()
    return messaging ? onMessage(messaging, callback) : () => { }
}

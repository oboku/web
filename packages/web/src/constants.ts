/* eslint-disable no-restricted-globals */
import { isMobileDetected } from "./common/utils"

// @ts-ignore
const sw: ServiceWorkerGlobalScope = self as any
const hostname =
  typeof window === "object"
    ? window?.location?.hostname
    : sw?.location?.hostname

export const API_URI = import.meta.env.VITE_API_URL || `https://${hostname}:4000`
export const API_COUCH_URI = import.meta.env.VITE_API_COUCH_URI || `https://${hostname}:4003`

export const FIREBASE_BASE_CONFIG = {
  apiKey: "AIzaSyDJIkOKxOCf3WXrsPldQrEIY7LY237YSGU",
  authDomain: "oboku-api.firebaseapp.com",
  projectId: "oboku-api",
  storageBucket: "oboku-api.appspot.com",
  messagingSenderId: "325550353363",
  appId: "1:325550353363:web:a1c53e1b63fe56ac829d26",
  measurementId: "G-8HE2QKW24V"
}

export const IS_MOBILE_DEVICE = isMobileDetected()

export const ROUTES = {
  HOME: "/",
  BOOK_DETAILS: "/book/:id",
  COLLECTION_DETAILS: "/collection/:id",
  PROFILE: "/profile",
  SETTINGS: "/profile/settings",
  STATISTICS: "/profile/statistics",
  DATASOURCES: "/datasources",
  LIBRARY_ROOT: "/library",
  LIBRARY_BOOKS: "/library/books",
  LIBRARY_COLLECTIONS: "/library/collections",
  LIBRARY_TAGS: "/library/tags",
  LOGIN: "/login",
  REGISTER: "/register",
  AUTH_CALLBACK: "/auth_callback",
  READER: "/reader/:id",
  SEARCH: "/search",
  PROBLEMS: "/problems"
} as const

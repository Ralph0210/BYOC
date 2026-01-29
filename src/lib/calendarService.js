/**
 * Google Calendar Service
 * Handles OAuth flow and API calls to Google Calendar
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY

// OAuth scopes - starting with readonly for exploration
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly",
].join(" ")

const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
]

// Token storage keys
const TOKEN_KEY = "google_calendar_token"
const EXPIRY_KEY = "google_calendar_token_expiry"

/**
 * Initialize the Google API client
 */
export async function initGoogleClient() {
  return new Promise((resolve, reject) => {
    // Load the Google API script if not already loaded
    if (window.gapi) {
      loadClient().then(resolve).catch(reject)
      return
    }

    const script = document.createElement("script")
    script.src = "https://apis.google.com/js/api.js"
    script.onload = () => loadClient().then(resolve).catch(reject)
    script.onerror = () => reject(new Error("Failed to load Google API"))
    document.body.appendChild(script)
  })
}

async function loadClient() {
  return new Promise((resolve, reject) => {
    window.gapi.load("client", async () => {
      try {
        await window.gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
        })
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })
}

/**
 * Load the Google Identity Services library for OAuth
 */
export function loadGoogleIdentityServices() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"))
    document.body.appendChild(script)
  })
}

/**
 * Initiate OAuth flow to connect Google Calendar
 */
export async function connectGoogleCalendar() {
  await loadGoogleIdentityServices()

  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(
        new Error(
          "Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.",
        ),
      )
      return
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error))
          return
        }

        // Store token and expiry
        const expiryTime = Date.now() + response.expires_in * 1000
        localStorage.setItem(TOKEN_KEY, response.access_token)
        localStorage.setItem(EXPIRY_KEY, expiryTime.toString())

        // Set token on gapi client
        window.gapi.client.setToken({ access_token: response.access_token })

        resolve({
          accessToken: response.access_token,
          expiresIn: response.expires_in,
        })
      },
    })

    tokenClient.requestAccessToken({ prompt: "consent" })
  })
}

/**
 * Check if we have a valid stored token
 */
export function isConnected() {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(EXPIRY_KEY)

  if (!token || !expiry) return false

  // Check if token is expired (with 5 min buffer)
  const expiryTime = parseInt(expiry, 10)
  return Date.now() < expiryTime - 5 * 60 * 1000
}

/**
 * Get stored access token
 */
export function getStoredToken() {
  if (!isConnected()) return null
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Disconnect Google Calendar
 */
export function disconnectGoogleCalendar() {
  const token = localStorage.getItem(TOKEN_KEY)

  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token)
  }

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRY_KEY)

  if (window.gapi?.client) {
    window.gapi.client.setToken(null)
  }
}

/**
 * Ensure the client is ready with a valid token
 */
async function ensureClient() {
  await initGoogleClient()

  const token = getStoredToken()
  if (!token) {
    throw new Error("Not connected to Google Calendar")
  }

  window.gapi.client.setToken({ access_token: token })
}

// ============================================
// Calendar API Methods
// ============================================

/**
 * List all calendars the user has access to
 */
export async function listCalendars() {
  await ensureClient()

  const response = await window.gapi.client.calendar.calendarList.list()
  return response.result.items || []
}

/**
 * Get events from a calendar within a date range
 */
export async function getEvents(calendarId = "primary", options = {}) {
  await ensureClient()

  const {
    timeMin = new Date().toISOString(),
    timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    maxResults = 50,
    singleEvents = true,
    orderBy = "startTime",
  } = options

  const response = await window.gapi.client.calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    maxResults,
    singleEvents,
    orderBy,
  })

  return response.result.items || []
}

/**
 * Get today's events
 */
export async function getTodayEvents(calendarId = "primary") {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return getEvents(calendarId, {
    timeMin: today.toISOString(),
    timeMax: tomorrow.toISOString(),
  })
}

/**
 * Get free/busy information for calendars
 */
export async function getFreeBusy(calendarIds = ["primary"], options = {}) {
  await ensureClient()

  const {
    timeMin = new Date().toISOString(),
    timeMax = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  } = options

  const response = await window.gapi.client.calendar.freebusy.query({
    timeMin,
    timeMax,
    items: calendarIds.map((id) => ({ id })),
  })

  return response.result.calendars || {}
}

/**
 * Get upcoming events for the week
 */
export async function getWeekEvents(calendarId = "primary") {
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  return getEvents(calendarId, {
    timeMin: now.toISOString(),
    timeMax: weekFromNow.toISOString(),
    maxResults: 100,
  })
}

/**
 * Get a single event by ID
 */
export async function getEvent(calendarId = "primary", eventId) {
  await ensureClient()

  const response = await window.gapi.client.calendar.events.get({
    calendarId,
    eventId,
  })

  return response.result
}

/**
 * Get calendar colors (for display)
 */
export async function getCalendarColors() {
  await ensureClient()

  const response = await window.gapi.client.calendar.colors.get()
  return response.result
}

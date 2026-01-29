import { useState, useEffect, useCallback } from "react"
import {
  initGoogleClient,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  isConnected as checkIsConnected,
  listCalendars,
  getTodayEvents,
  getWeekEvents,
  getFreeBusy,
  getCalendarColors,
} from "../lib/calendarService"

/**
 * Hook for managing Google Calendar connection and data
 */
export function useGoogleCalendar() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)

  // Calendar data
  const [calendars, setCalendars] = useState([])
  const [todayEvents, setTodayEvents] = useState([])
  const [weekEvents, setWeekEvents] = useState([])
  const [freeBusy, setFreeBusy] = useState({})
  const [colors, setColors] = useState(null)

  // Check connection status on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initGoogleClient()
        setIsConnected(checkIsConnected())
      } catch (err) {
        console.error("Failed to init Google client:", err)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  // Fetch calendar data when connected
  useEffect(() => {
    if (isConnected) {
      fetchCalendarData()
    }
  }, [isConnected])

  /**
   * Connect to Google Calendar
   */
  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)

    try {
      await connectGoogleCalendar()
      setIsConnected(true)
      return true
    } catch (err) {
      setError(err.message)
      console.error("Calendar connection failed:", err)
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [])

  /**
   * Disconnect from Google Calendar
   */
  const disconnect = useCallback(() => {
    disconnectGoogleCalendar()
    setIsConnected(false)
    setCalendars([])
    setTodayEvents([])
    setWeekEvents([])
    setFreeBusy({})
  }, [])

  /**
   * Fetch all calendar data
   */
  const fetchCalendarData = useCallback(async () => {
    if (!checkIsConnected()) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch calendars
      const calendarList = await listCalendars()
      setCalendars(calendarList)

      // Fetch today's events
      const today = await getTodayEvents()
      setTodayEvents(today)

      // Fetch week events
      const week = await getWeekEvents()
      setWeekEvents(week)

      // Fetch free/busy
      const calendarIds = calendarList.map((c) => c.id)
      const busy = await getFreeBusy(calendarIds)
      setFreeBusy(busy)

      // Fetch colors
      const colorData = await getCalendarColors()
      setColors(colorData)
    } catch (err) {
      setError(err.message)
      console.error("Failed to fetch calendar data:", err)

      // If token expired, disconnect
      if (
        err.message?.includes("invalid_token") ||
        err.message?.includes("expired")
      ) {
        disconnect()
      }
    } finally {
      setIsLoading(false)
    }
  }, [disconnect])

  /**
   * Refresh calendar data
   */
  const refresh = useCallback(() => {
    return fetchCalendarData()
  }, [fetchCalendarData])

  return {
    // Connection state
    isConnected,
    isLoading,
    isConnecting,
    error,

    // Actions
    connect,
    disconnect,
    refresh,

    // Data
    calendars,
    todayEvents,
    weekEvents,
    freeBusy,
    colors,
  }
}

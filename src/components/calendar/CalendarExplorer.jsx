import { useState } from "react"
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Video,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  CalendarClock,
  Eye,
  Code,
} from "lucide-react"
import { useGoogleCalendar } from "../../hooks/useGoogleCalendar"
import { cn } from "../../lib/utils"

/**
 * Calendar Explorer - Displays Google Calendar data for exploration
 * Shows what information is available from the API
 */
export function CalendarExplorer() {
  const {
    isConnected,
    isLoading,
    calendars,
    todayEvents,
    weekEvents,
    freeBusy,
    refresh,
  } = useGoogleCalendar()

  const [activeTab, setActiveTab] = useState("today")
  const [expandedEvent, setExpandedEvent] = useState(null)
  const [showRawData, setShowRawData] = useState(false)

  if (!isConnected) {
    return (
      <div className="text-center py-8 text-tertiary">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Connect your Google Calendar to explore available data</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-accent" />
        <span className="ml-2 text-secondary">Loading calendar data...</span>
      </div>
    )
  }

  const tabs = [
    {
      id: "today",
      label: "Today's Events",
      icon: CalendarDays,
      count: todayEvents.length,
    },
    {
      id: "week",
      label: "This Week",
      icon: CalendarClock,
      count: weekEvents.length,
    },
    {
      id: "calendars",
      label: "Calendars",
      icon: Calendar,
      count: calendars.length,
    },
    { id: "freebusy", label: "Free/Busy", icon: Clock },
  ]

  const currentEvents = activeTab === "today" ? todayEvents : weekEvents

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">
          Calendar Explorer
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRawData(!showRawData)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showRawData
                ? "bg-accent text-white"
                : "bg-surface hover:bg-surface-hover text-secondary",
            )}
            title="Toggle raw JSON view"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={refresh}
            className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-secondary transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                : "text-secondary hover:text-primary",
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && (
              <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Events Tab */}
        {(activeTab === "today" || activeTab === "week") && (
          <>
            {currentEvents.length === 0 ? (
              <div className="text-center py-6 text-tertiary">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No events {activeTab === "today" ? "today" : "this week"}</p>
              </div>
            ) : (
              currentEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isExpanded={expandedEvent === event.id}
                  onToggle={() =>
                    setExpandedEvent(
                      expandedEvent === event.id ? null : event.id,
                    )
                  }
                  showRaw={showRawData}
                />
              ))
            )}
          </>
        )}

        {/* Calendars Tab */}
        {activeTab === "calendars" && (
          <div className="space-y-2">
            {calendars.map((cal) => (
              <div
                key={cal.id}
                className="flex items-center gap-3 p-3 bg-surface rounded-lg"
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cal.backgroundColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">
                    {cal.summary}
                  </p>
                  <p className="text-xs text-tertiary truncate">{cal.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {cal.primary && (
                    <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                  <span className="text-xs text-tertiary capitalize">
                    {cal.accessRole}
                  </span>
                </div>
              </div>
            ))}

            {showRawData && (
              <RawDataView data={calendars} title="Calendars Raw Data" />
            )}
          </div>
        )}

        {/* Free/Busy Tab */}
        {activeTab === "freebusy" && (
          <div className="space-y-3">
            <p className="text-sm text-secondary">
              Free/busy information for the next 24 hours:
            </p>
            {Object.entries(freeBusy).map(([calId, data]) => (
              <div key={calId} className="p-3 bg-surface rounded-lg space-y-2">
                <p className="text-sm font-medium text-primary truncate">
                  {calId}
                </p>
                {data.busy?.length > 0 ? (
                  <div className="space-y-1">
                    {data.busy.map((slot, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-secondary">
                          {new Date(slot.start).toLocaleTimeString()} -{" "}
                          {new Date(slot.end).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-green-600">All free!</p>
                )}
              </div>
            ))}

            {showRawData && (
              <RawDataView data={freeBusy} title="Free/Busy Raw Data" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Event Card Component
 */
function EventCard({ event, isExpanded, onToggle, showRaw }) {
  const startTime = event.start?.dateTime
    ? new Date(event.start.dateTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "All day"

  const endTime = event.end?.dateTime
    ? new Date(event.end.dateTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""

  const eventDate = event.start?.dateTime
    ? new Date(event.start.dateTime).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : new Date(event.start?.date).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      })

  return (
    <div className="bg-surface rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-surface-hover transition-colors"
      >
        <div className="flex-shrink-0 mt-0.5">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-tertiary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-tertiary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary">
            {event.summary || "(No title)"}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-secondary">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {startTime}
              {endTime && ` - ${endTime}`}
            </span>
            <span>{eventDate}</span>
          </div>
        </div>

        {/* Quick indicators */}
        <div className="flex items-center gap-1">
          {event.attendees?.length > 0 && (
            <span title={`${event.attendees.length} attendees`}>
              <Users className="w-4 h-4 text-tertiary" />
            </span>
          )}
          {event.location && (
            <span title={event.location}>
              <MapPin className="w-4 h-4 text-tertiary" />
            </span>
          )}
          {event.conferenceData && (
            <span title="Video conference">
              <Video className="w-4 h-4 text-tertiary" />
            </span>
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-3 border-t border-border">
          {/* Event Details */}
          <div className="grid grid-cols-2 gap-2 pt-3 text-xs">
            <DetailRow label="Event ID" value={event.id} />
            <DetailRow label="Status" value={event.status} />
            <DetailRow
              label="Event Type"
              value={event.eventType || "default"}
            />
            <DetailRow
              label="Visibility"
              value={event.visibility || "default"}
            />
            <DetailRow
              label="Created"
              value={
                event.created ? new Date(event.created).toLocaleString() : "-"
              }
            />
            <DetailRow
              label="Updated"
              value={
                event.updated ? new Date(event.updated).toLocaleString() : "-"
              }
            />
          </div>

          {/* Location */}
          {event.location && (
            <div className="text-xs">
              <span className="text-tertiary">Location: </span>
              <span className="text-secondary">{event.location}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="text-xs">
              <span className="text-tertiary">Description: </span>
              <p className="text-secondary mt-1 whitespace-pre-wrap line-clamp-3">
                {event.description.replace(/<[^>]*>/g, "")}
              </p>
            </div>
          )}

          {/* Attendees */}
          {event.attendees?.length > 0 && (
            <div className="text-xs">
              <span className="text-tertiary">
                Attendees ({event.attendees.length}):{" "}
              </span>
              <div className="mt-1 space-y-1">
                {event.attendees.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        a.responseStatus === "accepted"
                          ? "bg-green-500"
                          : a.responseStatus === "declined"
                            ? "bg-red-500"
                            : a.responseStatus === "tentative"
                              ? "bg-yellow-500"
                              : "bg-gray-400",
                      )}
                    />
                    <span className="text-secondary truncate">{a.email}</span>
                    {a.organizer && (
                      <span className="text-tertiary">(organizer)</span>
                    )}
                  </div>
                ))}
                {event.attendees.length > 5 && (
                  <p className="text-tertiary">
                    ...and {event.attendees.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recurrence */}
          {event.recurrence && (
            <div className="text-xs">
              <span className="text-tertiary">Recurrence: </span>
              <span className="text-secondary font-mono">
                {event.recurrence.join(", ")}
              </span>
            </div>
          )}

          {/* Reminders */}
          {event.reminders && (
            <div className="text-xs">
              <span className="text-tertiary">Reminders: </span>
              <span className="text-secondary">
                {event.reminders.useDefault
                  ? "Using default reminders"
                  : event.reminders.overrides
                      ?.map((r) => `${r.method} ${r.minutes}min before`)
                      .join(", ") || "None"}
              </span>
            </div>
          )}

          {/* Conference Data */}
          {event.conferenceData && (
            <div className="text-xs">
              <span className="text-tertiary">Conference: </span>
              <a
                href={event.conferenceData.entryPoints?.[0]?.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {event.conferenceData.conferenceSolution?.name ||
                  "Join meeting"}
              </a>
            </div>
          )}

          {/* Raw JSON */}
          {showRaw && <RawDataView data={event} title="Event Raw Data" />}
        </div>
      )}
    </div>
  )
}

/**
 * Detail Row Component
 */
function DetailRow({ label, value }) {
  return (
    <div className="text-xs">
      <span className="text-tertiary">{label}: </span>
      <span className="text-secondary font-mono">{value || "-"}</span>
    </div>
  )
}

/**
 * Raw Data View Component
 */
function RawDataView({ data, title }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mt-2 border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 bg-surface-hover text-xs font-mono"
      >
        <span className="flex items-center gap-2">
          <Eye className="w-3 h-3" />
          {title}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>
      {isExpanded && (
        <pre className="p-2 text-xs bg-gray-900 text-green-400 overflow-x-auto max-h-64">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}

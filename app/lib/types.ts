/**
 * Type for result from get_weather() function call
 */
export interface Coordinates {
  lat: number
  lng: number
  temperature?: {
    value: number
    units: string
  }
  wind_speed?: {
    value: number
    units: string
  }
  location?: string
}

/**
 * Type for all event logs
 */
export interface RealtimeEvent {
  time: string
  count?: number
  source: 'client' | 'server'
  event: { [key: string]: any }
}

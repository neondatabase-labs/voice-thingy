/**
 * Type for all event logs
 */
export interface RealtimeEvent {
  time: string
  count?: number
  source: 'client' | 'server'
  event: { [key: string]: any }
}

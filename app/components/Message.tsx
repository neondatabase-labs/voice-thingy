import { ItemType } from '@openai/realtime-api-beta/dist/lib/client'
import { Cpu, User } from 'react-feather'

export default function ({ conversationItem }: { conversationItem: ItemType }) {
  return (
    <div className="flex flex-row break-all items-start gap-x-3 max-w-[300px]">
      <div className="rounded bg-gray-100 p-2 max-w-max">{conversationItem.role === 'user' ? <User /> : <Cpu />}</div>
      <div className="flex flex-col gap-y-2">
        {conversationItem.role === 'user' && (
          <div>
            {conversationItem.formatted.transcript || (conversationItem.formatted.audio?.length ? '(awaiting transcript)' : conversationItem.formatted.text || '(item sent)')}
          </div>
        )}
        {conversationItem.role === 'assistant' && <div>{conversationItem.formatted.transcript || conversationItem.formatted.text || '(truncated)'}</div>}
        {conversationItem.formatted?.file && <audio controls src={conversationItem.formatted.file.url} />}
      </div>
    </div>
  )
}

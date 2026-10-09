import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

// When the last main-loop turn finished, for the next prompt's context. Kept
// in the session's state, so a reload of the mod doesn't forget it.
const lastDone = atom({ plugin: 'clock', key: 'lastDone' } as const, null)

const pad = (n: number): string => String(n).padStart(2, '0')

// DD/MM/YYYY  HH:mm:ss in the machine's local time.
export const stamp = (ms: number): string => {
  const d = new Date(ms)

  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// UTC+01:00, so Claude can tell the stamps' zone apart.
export const utcOffset = (ms: number): string => {
  const minutes = -new Date(ms).getTimezoneOffset()
  const sign = minutes < 0 ? '-' : '+'
  const abs = Math.abs(minutes)

  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

// 7s, 1m 23s, 1h 02m 05s.
export const took = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = total % 60
  if (h > 0) {
    return `${h}h ${pad(m)}m ${pad(sec)}s`
  }

  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

export const register: Register = on => {
  // The model reads this beside the prompt; the person never sees it.
  on('prompt.submit', async ($, e, next) => {
    const now = await $.clock.now()
    const done = await read($, lastDone)
    const previous = done === null ? '' : ` The previous response finished at ${stamp(done)}.`
    const note = `Local time when this prompt was submitted: ${stamp(now)} (${utcOffset(now)}).${previous}`

    return next({ ...e, context: [...(e.context ?? []), note] })
  })

  // Subagents raise no turn.start, so this is the main loop's alone.
  on('turn.start', async ($, e, next) => {
    $.ui.log(`${stamp(await $.clock.now())}  Started`)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId !== undefined) {
      return result
    }
    const now = await $.clock.now()
    await update($, lastDone, () => now)
    const why = e.reason === 'aborted' ? 'interrupted, ' : e.reason === 'error' ? 'error, ' : ''
    $.ui.log(`${stamp(now)}  Done  (${why}time taken: ${took(e.durationMs)})`)

    return result
  })
}

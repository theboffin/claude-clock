import { expect, mock, test } from 'claude-code/testing'

import { stamp, took } from './register'

// 09/10/2026 09:41:05 local, whatever zone the machine is in.
const START = new Date(2026, 9, 9, 9, 41, 5).getTime()

test('stamps are DD/MM/YYYY  HH:mm:ss', () => {
  expect(stamp(START)).toBe('09/10/2026  09:41:05')
})

test('time taken reads as 7s, 1m 23s, 1h 02m 05s', () => {
  expect(took(7_200)).toBe('7s')
  expect(took(83_000)).toBe('1m 23s')
  expect(took(3_725_000)).toBe('1h 02m 05s')
})

test('logs Started and Done around a turn and tells the model the time', async ($, on) => {
  const clock = mock.clock(on, { now: START })
  const logs: string[] = []
  const contexts: (readonly string[] | undefined)[] = []
  on('ui.log', (_$, e) => {
    logs.push(e.text)
  })
  on('prompt.submit', (_$, e) => {
    contexts.push(e.context)

    return { text: e.text }
  })
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))

  await $.prompt.submit({ text: 'hi', wait: false })
  await $.turn.start({ text: 'hi', turnId: 't1' })
  await clock.advance(83_000)
  await $.turn.complete({
    answer: 'hello', durationMs: 83_000, isAborted: false, turnId: 't1', reason: 'answer',
  })

  expect(logs).toEqual(['09/10/2026  09:41:05  Started', '09/10/2026  09:42:28  Done  (time taken: 1m 23s)'])
  expect(contexts[0]?.[0]).toMatch(/^Local time when this prompt was submitted: 09\/10\/2026  09:41:05 \(UTC[+-]\d\d:\d\d\)\.$/)

  await clock.advance(60_000)
  await $.prompt.submit({ text: 'again', wait: false })
  expect(contexts[1]?.[0]).toContain('The previous response finished at 09/10/2026  09:42:28.')

  await $.turn.start({ text: 'again', turnId: 't3' })
  await clock.advance(5_000)
  await $.turn.complete({
    answer: '', durationMs: 5_000, isAborted: true, turnId: 't3', reason: 'aborted',
  })
  expect(logs.at(-1)).toBe('09/10/2026  09:43:33  Done  (interrupted, time taken: 5s)')
})

test("a subagent's turn logs nothing", async ($, on) => {
  mock.clock(on, { now: START })
  const logs: string[] = []
  on('ui.log', (_$, e) => {
    logs.push(e.text)
  })
  on('turn.complete', (_$, e) => ({ text: e.answer }))

  await $.turn.complete({
    answer: 'report', durationMs: 1, isAborted: false, turnId: 't2', reason: 'answer', agentId: 'a1',
  })
  expect(logs).toEqual([])
})

export type LastDone = number | null

declare module 'claude-code' {
  interface PluginState {
    clock: { lastDone: LastDone }
  }
}

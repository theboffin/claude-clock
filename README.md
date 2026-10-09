# clock

A Claude Code plugin that timestamps your work. Each turn in the transcript gets a start and finish line:

```
clock  09/10/2026  09:52:50  Started
...
clock  09/10/2026  09:52:59  Done  (time taken: 10s)
```

- Interrupted turns show `Done  (interrupted, time taken: 5s)`; turns that end on an API error show `Done  (error, ...)`.
- Subagents running in the background don't add lines.
- Every prompt also carries hidden context for Claude with the local time and when the previous response finished, so Claude knows when things happen and how long you've been away.

Times are your machine's local time, in `DD/MM/YYYY  HH:mm:ss`.

## Install

At the prompt of a terminal Claude Code session:

```
/plugin install clock --marketplace theboffin/claude-clock
```

Answer `y` to add the marketplace, then pick the user scope so it loads in every session, including the desktop app's Code tab.

Or from a shell:

```
claude plugin marketplace add theboffin/claude-clock
claude plugin install clock@bdukes-mods --scope user
```

## Turn it off

```
claude plugin disable clock@bdukes-mods
```

## Develop

The hooks are in `hooks/register.ts`; tests in `hooks/clock.test.ts`.

```
claude plugin validate .
claude plugin test .
```

# OLYMPUS Desktop ☤

<p align="center">
  <a href="https://github.com/Moisesjr20/olympus-agent-descktop-integral/releases"><img src="https://img.shields.io/badge/Download-macOS%20%C2%B7%20Windows%20%C2%B7%20Linux-0a1628?style=for-the-badge" alt="Download"></a>
  <a href="https://github.com/Moisesjr20/olympus-agent-descktop-integral"><img src="https://img.shields.io/badge/Fork%20of-NousResearch%2Fhermes--agent-FFD700?style=for-the-badge" alt="Upstream"></a>
  <a href="https://github.com/Moisesjr20/olympus-agent-descktop-integral/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License: MIT"></a>
</p>

**O desktop nativo do OLYMPUS — fork da Kyrius sobre o [Hermes Agent](../../README.md) da [Nous Research](https://nousresearch.com).** Mesmo agente, mesmas skills, mesma memória do CLI e do gateway, numa janela nativa com a marca OLYMPUS — chat com tool output em tempo real, previews lado a lado, navegador de arquivos, voz e configurações, sem terminal. Disponível pra **macOS, Windows e Linux**.

> Este é um fork white-label: identidade visual (ícones, nome, appId) trocada
> pra OLYMPUS/Kyrius via `HERMES_DESKTOP_VARIANT=olympus` em
> [`product-identity.cjs`](./product-identity.cjs); arquitetura, protocolo de
> gateway e backend Python seguem idênticos ao upstream. Ver
> [`AGENTS.md`](./AGENTS.md) e o skill `olympus-desktop-integral` do Hermes
> pra detalhes do rebrand.

<table>
<tr><td><b>Chat com o agente completo</b></td><td>Respostas em streaming, atividade de tools em tempo real, resumos estruturados e o mesmo histórico de conversa de qualquer outra superfície Hermes.</td></tr>
<tr><td><b>Previews lado a lado</b></td><td>Renderiza páginas web, arquivos e saídas de tools num painel à direita enquanto você continua conversando.</td></tr>
<tr><td><b>Navegador de arquivos</b></td><td>Explora e visualiza o diretório de trabalho sem saber do app.</td></tr>
<tr><td><b>Voz</b></td><td>Fala com o OLYMPUS e ouve a resposta.</td></tr>
<tr><td><b>Configurações & onboarding</b></td><td>Gerencia providers, modelos, tools e credenciais numa UI real.</td></tr>
<tr><td><b>Bot Mode</b></td><td>Cada perfil Hermes aparece como um agente com chat próprio — a visão nativa da nossa frota multi-agente.</td></tr>
</table>

---

## Install

### Modo dev (testar rápido, sem empacotar)

```powershell
# Windows — clona, instala deps, sobe isolado do Hermes Desktop principal
powershell -ExecutionPolicy Bypass -File test-olympus-desktop.ps1
```

```bash
# macOS/Linux
npm ci
HERMES_DESKTOP_VARIANT=olympus npm run dev --workspace apps/desktop
```

### Instalador MSIX definitivo (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File build-and-install-olympus.ps1
```

Builda o pacote nativo real (`scripts\build-bundle.ps1 -Variant olympus`, runtime
Python/Node embutido), assina com certificado de teste local e instala. Exige
Python 3.11+ e Visual Studio Build Tools (C++) no host de build — ver
[BUILDING.md](BUILDING.md).

### Instaladores oficiais (upstream, não esta marca)

Os instaladores do Hermes Agent "oficial" (sem rebrand) são distribuídos em
[hermes-agent.nousresearch.com](https://hermes-agent.nousresearch.com/) — não
têm a marca OLYMPUS, só uso se quiser comparar com o upstream puro.

---

## Updating

Update through the owner of the installed artifact: Windows App Installer for
sideload MSIX, Microsoft Store for Store packages, and `electron-updater` for
macOS bundles. Source-built apps use the checkout update handoff.

`hermes update` updates managed source checkouts; it does not rewrite a bundled
payload. See [BUILDING.md](BUILDING.md) for package and release contracts.

---

## Screenshot shortcut (macOS)

Enable **Settings → Keyboard Shortcuts → Screenshot shortcut**, then press the
left and right Command keys together in any app. Hermes captures that app's
frontmost window and attaches the image to the last-active Hermes composer,
including split-pane chats. It does not send the draft or capture the whole
screen. Release both keys before taking another screenshot.

The shortcut is off by default and saved only on this Mac. macOS requires
**Input Monitoring** and **Screen & System Audio Recording** permission; the
settings row links to the relevant system pane and offers Retry. If macOS asks
to restart the app after granting access, do so before retrying. Review the
attachment before sending, especially when the captured window is sensitive.

## Requirements

Bundled packages provide Python 3.14 and their supported dependencies.
Source/bootstrap builds have a separate preparation path. Platform-native
requirements, including system Git on POSIX, are described in [BUILDING.md](BUILDING.md).
macOS source builds also require Xcode Command Line Tools to compile the native
shortcut helper. Prebuilt installers include it; no compiler is needed at runtime.

---

## Development

Want to hack on the app itself? Install workspace deps from the repo root once, then run the dev server from this directory:

```bash
npm install          # from repo root — links apps/desktop, web, apps/shared
cd apps/desktop
npm run dev          # Vite renderer + Electron, which boots the Python backend
```

Point the app at a specific source checkout, or sandbox it away from your real config:

```bash
# throwaway HERMES_HOME, separate Electron userData, distinct app name to avoid the single-instance lock
../../scripts/dev-sandbox.sh npm run dev
HERMES_DESKTOP_HERMES_ROOT=/path/to/clone npm run dev
HERMES_HOME=$HOME/.hermes/cache/scratch/throwaway npm run dev
npm run dev:fake-boot   # exercise the startup overlay with deterministic delays
```

### Building installers

```bash
npm run dist:mac     # DMG + zip
npm run dist:win     # MSIX
npm run dist:linux   # AppImage + deb + rpm
npm run pack         # unpacked app under release/ (no installer)
```

These are ordinary packaging commands, not complete tagged payload builds.
Use [BUILDING.md](BUILDING.md) for the native bundled builder, Azure/Apple
signing, R2 artifact publication, and release gates. The current release matrix
publishes Windows and macOS packages; Linux desktop legs are disabled.

### How it works

The bundled app carries the Electron shell, native React chat surface, and
local agent payload. It runs the payload directly from resources. User data
lives in `HERMES_HOME` outside the app. Bootstrap builds instead provision a
source installation. A remote-only Light variant exists as a build target but
is not published.

The app has three boundaries:

- **Electron** resolves and validates a runnable backend, owns native
  filesystem/git/window capabilities, and exposes a narrow preload bridge.
- **React** owns the Desktop routes, panes, interaction state, and
  `@assistant-ui/react` transcript.
- **Hermes Agent** runs as a headless `hermes serve` process and exposes the
  `tui_gateway` JSON-RPC/WebSocket API. The renderer connects through
  [`apps/shared`](../shared/), which is also used by the browser dashboard.

A bundled artifact uses its payload. If that payload is unusable, the app
reports damage rather than installing a second checkout. It does not adopt
an arbitrary `hermes` command on PATH or a system Python installation.

Non-bundled builds can use the explicit source-root override, development
checkout, completed managed install, or `HERMES_DESKTOP_HERMES` deployment
override before offering bootstrap. Candidates are probed before use.
A runtime that predates `serve` falls back to headless
`dashboard --no-open`. This is compatibility for the backend command only and
does not launch or embed the dashboard UI.

The Electron orchestration entry point is `electron/main.ts`; pure resolution,
probe, hardening, and platform policies live in focused modules beside it. The
renderer is under `src/`, with shared atoms in `src/store` and transport/native
adapters in `src/lib`.

Before changing the app, read:

- [`AGENTS.md`](./AGENTS.md): architecture, state ownership, resolver/fallback,
  transport, performance, and testing rules.
- [`DESIGN.md`](./DESIGN.md): visual system, information architecture, motion,
  direct manipulation, and keyboard behavior.

### Connections, projects, and switching

Desktop supports a managed local backend, explicit remote gateways, and Hermes
Cloud connections. Remote and cloud modes use the same remote-capability path;
authentication and discovery differ, not the renderer feature model.

When no usable local runtime or saved remote connection exists, the first-run
screen offers **Connect to existing Hermes** before starting the local installer.
Desktop probes the gateway to discover token or OAuth authentication, requires a
successful HTTP and WebSocket connection test, and saves the connection using
the same encrypted Desktop configuration used by Settings. A saved remote
connection bypasses this choice on later launches. The regular Desktop build
still includes the local-install option; this is a remote operating mode, not a
separate client-only application.

In remote mode the gateway host is the execution boundary: agent tools,
terminal commands, and file operations run against the remote Hermes host, not
the computer displaying the Desktop UI.

Remote gateways that sit behind an access proxy may require extra headers on
every HTTP and WebSocket request. Configure them per connection in Settings →
Connections (Extra gateway headers), or add a `headers` object to Desktop's
Electron `userData/connection.json` remote block:

```json
{
  "mode": "remote",
  "remote": {
    "url": "https://hermes.example.com",
    "authMode": "token",
    "token": { "encoding": "safeStorage", "value": "..." },
    "headers": {
      "CF-Access-Client-Id": { "encoding": "safeStorage", "value": "..." },
      "CF-Access-Client-Secret": { "encoding": "safeStorage", "value": "..." }
    }
  }
}
```

Per-profile remote entries under `profiles[name].headers` use the same shape.
Desktop applies these headers only to matching remote gateway requests, treats
`https` and `wss` as the same gateway origin for WebSocket upgrades, and drops
transport- or Hermes-managed header names such as `Authorization`, `Cookie`,
`Host`, `Origin`, `Referer`, and `X-Hermes-Session-Token`.

Projects are the workspace abstraction. A project may own multiple folders,
repositories, worktrees, and sessions; a bare new chat remains detached unless
the user enters a project or configures a default project directory. Use the
Projects UI rather than adding a second per-session folder-picker workflow.

Changing profiles or connection modes is a soft workspace switch, not another
cold boot. The shell and current management overlay remain mounted while
gateway-bound nanostores are wiped, query-backed data is invalidated, and the
new connection repopulates skeletons. This prevents rows or transcripts from
the previous gateway bleeding into the next one. Switching changes only the
foreground view and request route: it does not cancel turns or stop a backend,
and retained background sockets continue receiving events from running jobs.

### Verification

Run before opening a PR (lint may surface pre-existing warnings but must exit cleanly):

```bash
npm run fix
npm run typecheck
npm run lint
npm run test:ui
npm run test:desktop:platforms
```

Run `npm run test:desktop:all` for install, boot, update, packaging, or other
release-path changes.

### Troubleshooting

Boot logs land in `HERMES_HOME/logs/desktop.log` (includes backend output and recent Python tracebacks) — check it first if the app reports a boot failure.

**macOS / Linux:**

```bash
# Force a clean first-launch setup
rm "$HOME/.hermes/hermes-agent/.hermes-bootstrap-complete"
# Rebuild a broken Python venv
rm -rf "$HOME/.hermes/hermes-agent/venv"
# Reset a stuck macOS microphone prompt (macOS only)
tccutil reset Microphone com.kyrius.olympus
```

**Windows (PowerShell):**

```powershell
# Force a clean first-launch setup
Remove-Item "$env:LOCALAPPDATA\hermes\hermes-agent\.hermes-bootstrap-complete"
# Rebuild a broken Python venv
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\hermes\hermes-agent\venv"
```

> The default Hermes home on Windows is `%LOCALAPPDATA%\hermes`. Set the `HERMES_HOME` env var if you've relocated it.

---

## Community

- 📦 [Repositório (fork OLYMPUS)](https://github.com/Moisesjr20/olympus-agent-descktop-integral)
- 💬 [Discord (upstream)](https://discord.gg/NousResearch)
- 📖 [Documentação (upstream)](https://hermes-agent.nousresearch.com/docs/)
- 🐛 [Issues (upstream)](https://github.com/NousResearch/hermes-agent/issues)

---

## License

MIT — see [LICENSE](../../LICENSE).

OLYMPUS Desktop é um fork white-label mantido pela Kyrius, sobre o
[Hermes Agent](https://github.com/NousResearch/hermes-agent), construído pela
[Nous Research](https://nousresearch.com). Crédito integral ao projeto
upstream — este fork só troca identidade visual, não reimplementa o agente.

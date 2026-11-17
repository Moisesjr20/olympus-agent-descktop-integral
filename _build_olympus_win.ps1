$ErrorActionPreference = 'Stop'
$repo = "C:\Users\moise\Downloads\olympus-agent-descktop-integral"
Set-Location $repo
$log = Join-Path $repo "build-olympus-win.log"
"[START] building OLYMPUS win MSIX" | Out-File -FilePath $log -Encoding utf8

# pm's payload detection treats the clone as a "packaged" install when a
# manifest.json sits in the parent dir (Downloads). Move the stray PWA
# manifest aside for the build and ALWAYS restore it in finally.
$manifest = "C:\Users\moise\Downloads\manifest.json"
$manifestBak = "C:\Users\moise\Downloads\manifest.json.olympusbuild-bak"
$movedManifest = $false
if (Test-Path $manifest) {
    Move-Item -Force $manifest $manifestBak
    $movedManifest = $true
    "[INFO] moved stray Downloads\manifest.json aside for build" | Tee-Object -FilePath $log -Append
}

function Step($name, [scriptblock]$block) {
    "[STEP] $name" | Tee-Object -FilePath $log -Append | Out-Null
    & $block *>&1 | Tee-Object -FilePath $log -Append
    if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
        "[FAIL] $name exit=$LASTEXITCODE" | Tee-Object -FilePath $log -Append
        throw "$name failed ($LASTEXITCODE)"
    }
}

try {
    Step "activate PM env" { . ./activate.ps1 }
    # activate puts the prepared interpreter on PATH but does not export
    # HERMES_PYTHON; the payload builder (scripts/build/python.mjs) requires it.
    $pyExe = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
    if (-not $pyExe) { throw "python.exe not found on PATH after activate" }
    $env:HERMES_PYTHON = $pyExe
    "[INFO] HERMES_PYTHON=$pyExe" | Tee-Object -FilePath $log -Append
    Step "pnpm install --frozen-lockfile" { pnpm install --frozen-lockfile }
    Set-Location (Join-Path $repo "apps/desktop")
    # olympus is a bundled variant -> stage the Python agent payload first
    # (build/agent-payload/manifest.json), exactly like dist:bundled does.
    Step "pnpm run payload (stage agent)" { pnpm run payload }
    $env:HERMES_DESKTOP_VARIANT = 'olympus'
    Step "pnpm dist:win (olympus)" { pnpm dist:win }
    "[OK] build finished" | Tee-Object -FilePath $log -Append
    "[ARTIFACTS]" | Tee-Object -FilePath $log -Append
    Get-ChildItem (Join-Path $repo "apps/desktop/dist") -Recurse -Include *.msix,*.appx,*.exe -ErrorAction SilentlyContinue |
        Select-Object FullName, @{n='MB';e={[math]::Round($_.Length/1MB,1)}} |
        Format-Table -Auto | Out-String | Tee-Object -FilePath $log -Append
} catch {
    "[ERROR] $_" | Tee-Object -FilePath $log -Append
    throw
} finally {
    if ($movedManifest -and (Test-Path $manifestBak)) {
        Move-Item -Force $manifestBak $manifest
        "[INFO] restored Downloads\manifest.json" | Tee-Object -FilePath $log -Append
    }
}

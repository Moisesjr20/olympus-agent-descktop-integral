$ErrorActionPreference = 'Stop'
$log = "C:\Users\moise\Downloads\olympus-agent-descktop-integral\install-olympus.log"
$msix = "C:\Users\moise\Downloads\olympus-agent-descktop-integral\apps\desktop\release\Olympus-0.0.0-win-x64.msix"
"[START] installing $msix" | Out-File -FilePath $log -Encoding utf8

try {
    "[STEP] Add-AppxPackage (new Kyrius.Olympus)" | Tee-Object -FilePath $log -Append
    Add-AppxPackage -Path $msix -ErrorAction Stop
    "[OK] install command returned" | Tee-Object -FilePath $log -Append

    $new = Get-AppxPackage -Name "Kyrius.Olympus" -ErrorAction SilentlyContinue
    if (-not $new) {
        throw "new package Kyrius.Olympus not found after install — aborting, old app left intact"
    }
    "[OK] new installed: $($new.PackageFullName)" | Tee-Object -FilePath $log -Append

    $old = Get-AppxPackage -Name "Kyrius.OlympusCommit4ae2e75" -ErrorAction SilentlyContinue
    if ($old) {
        "[STEP] removing old $($old.PackageFullName)" | Tee-Object -FilePath $log -Append
        $old | Remove-AppxPackage -ErrorAction Stop
        "[OK] old removed" | Tee-Object -FilePath $log -Append
    } else {
        "[INFO] old Kyrius.OlympusCommit4ae2e75 not found (already gone)" | Tee-Object -FilePath $log -Append
    }

    "[RESULT] OLYMPUS packages now installed:" | Tee-Object -FilePath $log -Append
    Get-AppxPackage | Where-Object { $_.Name -match "lympus" } |
        Select-Object Name, Version, PackageFullName |
        Format-List | Out-String | Tee-Object -FilePath $log -Append
    "[DONE]" | Tee-Object -FilePath $log -Append
} catch {
    "[ERROR] $_" | Tee-Object -FilePath $log -Append
    throw
}

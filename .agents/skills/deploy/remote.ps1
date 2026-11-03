param(
    [Parameter(Mandatory=$true)][string]$Release,
    [Parameter(Mandatory=$true)][string]$Old,
    [Parameter(Mandatory=$true)][string]$New,
    [Parameter(Mandatory=$true)][string]$BundleHash,
    [Parameter(Mandatory=$true)][string]$PortalHash,
    [Parameter(Mandatory=$true)][string]$BotHash,
    [Parameter(Mandatory=$true)][string]$DepsHash
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if ($Release -notmatch '^\d{8}-\d{6}$') { throw 'Invalid release name.' }
$root = 'D:\projects_production\NY_hr_sys_new'
$stage = "D:\projects_production\deploy-staging\$Release"
$backup = "D:\projects_production\deploy-backups\NY_hr_sys_new\$Release"
if ((Resolve-Path -LiteralPath $root).Path -ne $root) { throw 'Unexpected production root.' }
foreach ($item in @(
    @{ Name='source.bundle'; Hash=$BundleHash },
    @{ Name='portal-dist.zip'; Hash=$PortalHash },
    @{ Name='index.mjs'; Hash=$BotHash }
)) {
    $actual = (Get-FileHash -LiteralPath (Join-Path $stage $item.Name) -Algorithm SHA256).Hash
    if ($actual -ne $item.Hash) { throw "Artifact hash mismatch: $($item.Name)" }
}
$hasBotDeps = $DepsHash -ne 'NONE'
if ($hasBotDeps -and (Get-FileHash -LiteralPath "$stage\bot-deps.zip" -Algorithm SHA256).Hash -ne $DepsHash) {
    throw 'Bot dependency hash mismatch.'
}
if ((git -C $root rev-parse HEAD).Trim() -ne $Old) { throw 'Production HEAD changed.' }
if (@(git -C $root status --porcelain).Count -gt 0) { throw 'Production repo is dirty.' }
if (Test-Path -LiteralPath $backup) { throw 'Backup already exists; inspect the previous attempt.' }
New-Item -ItemType Directory -Path $backup | Out-Null
git -C $root branch "backup/pre-$Release" $Old
if ($LASTEXITCODE -ne 0) { throw 'Cannot create backup branch.' }
Copy-Item "$root\backend\.env" "$backup\backend.env"
Compress-Archive -Path "$root\frontend\portal-dist\*" -DestinationPath "$backup\portal-dist.zip"
Copy-Item "$root\zalo_bot\dist\index.mjs" "$backup\bot-index.mjs"
if ($hasBotDeps) {
    if ((Resolve-Path -LiteralPath "$root\zalo_bot\node_modules").Path -ne "$root\zalo_bot\node_modules") {
        throw 'Unexpected bot dependency path.'
    }
    Compress-Archive -Path "$root\zalo_bot\node_modules" -DestinationPath "$backup\bot-deps.zip"
}
git -C $root fetch "$stage\source.bundle" refs/heads/master
if ($LASTEXITCODE -ne 0) { throw 'Cannot fetch bundle.' }
if ((git -C $root rev-parse FETCH_HEAD).Trim() -ne $New) { throw 'Bundle target mismatch.' }
git -C $root merge-base --is-ancestor $Old FETCH_HEAD
if ($LASTEXITCODE -ne 0) { throw 'Bundle does not extend production.' }

$servicesStopped = $false
try {
    $servicesStopped = $true
    Stop-Service 'ny-foreign-hr-8004','ny-meal-reporting-8006'
    git -C $root merge --ff-only FETCH_HEAD
    if ($LASTEXITCODE -ne 0) { throw 'Git fast-forward failed.' }
    Push-Location "$root\backend"
    try {
        & 'C:\Users\Admin\.local\bin\uv.exe' sync
        if ($LASTEXITCODE -ne 0) { throw 'uv sync failed.' }
    } finally { Pop-Location }
    Expand-Archive "$stage\portal-dist.zip" "$stage\portal" -Force
    Copy-Item "$stage\portal\assets\*" "$root\frontend\portal-dist\assets" -Force
    Copy-Item "$stage\portal\portal.html" "$root\frontend\portal-dist\portal.html" -Force
    Stop-Service 'ny-zalo-reminder-bot'
    if ($hasBotDeps) {
        Expand-Archive "$stage\bot-deps.zip" "$stage\bot-deps" -Force
        Move-Item -LiteralPath "$root\zalo_bot\node_modules" -Destination (Join-Path $backup 'node_modules')
        Copy-Item "$stage\bot-deps\node_modules" "$root\zalo_bot\node_modules" -Recurse
    }
    Copy-Item "$stage\index.mjs" "$root\zalo_bot\dist\index.mjs" -Force
    Start-Service 'ny-zalo-reminder-bot'
    Start-Service 'ny-meal-reporting-8006','ny-foreign-hr-8004'
    $servicesStopped = $false
} finally {
    if ($servicesStopped) {
        Start-Service 'ny-zalo-reminder-bot','ny-meal-reporting-8006','ny-foreign-hr-8004' -ErrorAction SilentlyContinue
    }
}
if ((git -C $root rev-parse HEAD).Trim() -ne $New) { throw 'Production commit mismatch after deploy.' }
if (@(git -C $root status --porcelain).Count -gt 0) { throw 'Production repo is dirty after deploy.' }
$services = Get-Service 'ny-foreign-hr-8004','ny-meal-reporting-8006','ny-zalo-reminder-bot','NY-Caddy'
if (@($services | Where-Object { $_.Status -ne 'Running' }).Count -gt 0) { throw 'Production service is not running.' }
$healthy = $false
for ($attempt = 0; $attempt -lt 15; $attempt++) {
    try {
        $hr = Invoke-WebRequest 'http://127.0.0.1:8004/' -UseBasicParsing
        $portal = Invoke-RestMethod 'http://192.168.209.62:8006/health'
        if ($hr.StatusCode -eq 200 -and $portal.status -eq 'ok') { $healthy = $true; break }
    } catch { }
    if ($attempt -lt 14) { Start-Sleep -Seconds 2 }
}
if (-not $healthy) { throw 'Local HTTP health check failed.' }
Write-Output "REMOTE_OK commit=$New hr=$($hr.StatusCode) portal=$($portal.status) backup=$backup"

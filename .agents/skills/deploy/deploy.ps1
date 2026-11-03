param([switch]$CheckOnly)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$hostName = 'Admin@192.168.209.62'
$production = 'D:/projects_production/NY_hr_sys_new'
function Assert-ReleaseFilesClean {
    git diff --quiet HEAD -- backend frontend zalo_bot
    if ($LASTEXITCODE -ne 0) { throw 'Release files differ from HEAD. Commit intended changes first.' }
    $untracked = @(git ls-files --others --exclude-standard -- backend frontend zalo_bot)
    if ($untracked.Count -gt 0) { throw "Untracked release files: $($untracked -join ', ')" }
}
Push-Location $repo
try {
    if ((git branch --show-current).Trim() -ne 'master') { throw 'Merge the release into master first.' }
    Assert-ReleaseFilesClean
    git fetch origin master
    if ($LASTEXITCODE -ne 0) { throw 'Cannot fetch origin/master.' }
    git merge-base --is-ancestor origin/master HEAD
    if ($LASTEXITCODE -ne 0) { throw 'Origin/master has commits not in local master.' }
    $new = (git rev-parse HEAD).Trim()
    $old = (& ssh -o BatchMode=yes -o ConnectTimeout=8 $hostName "git -C $production rev-parse HEAD").Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Cannot read production HEAD.' }
    git merge-base --is-ancestor $old $new
    if ($LASTEXITCODE -ne 0) { throw 'Production HEAD is not an ancestor of local master.' }
    if ($old -eq $new -and -not $CheckOnly) { throw 'Production already runs this commit.' }

    Push-Location (Join-Path $repo 'backend')
    try { uv run pytest -q --disable-warnings; if ($LASTEXITCODE -ne 0) { throw 'Backend tests failed.' } }
    finally { Pop-Location }
    Push-Location (Join-Path $repo 'frontend')
    try {
        npm run build; if ($LASTEXITCODE -ne 0) { throw 'HR frontend build failed.' }
        npm run build:portal; if ($LASTEXITCODE -ne 0) { throw 'Portal build failed.' }
    } finally { Pop-Location }
    Push-Location (Join-Path $repo 'zalo_bot')
    try {
        npm test; if ($LASTEXITCODE -ne 0) { throw 'Bot tests failed.' }
        npm run typecheck; if ($LASTEXITCODE -ne 0) { throw 'Bot typecheck failed.' }
        npm run build; if ($LASTEXITCODE -ne 0) { throw 'Bot build failed.' }
    } finally { Pop-Location }
    Assert-ReleaseFilesClean
    git restore --worktree -- frontend/dist
    if ($LASTEXITCODE -ne 0) { throw 'Cannot clear build-only line-ending changes.' }
    git diff --check HEAD -- backend frontend zalo_bot
    if ($LASTEXITCODE -ne 0) { throw 'Whitespace check failed.' }
    if ($CheckOnly) { Write-Output "CHECK_OK old=$old target=$new"; exit 0 }

    git push origin master
    if ($LASTEXITCODE -ne 0) { throw 'Cannot push master.' }
    $remote = (git ls-remote origin refs/heads/master).Split("`t")[0]
    if ($remote -ne $new) { throw 'Origin/master does not match the release commit.' }

    $release = Get-Date -Format 'yyyyMMdd-HHmmss'
    $stage = Join-Path $repo ".scratch\deploy-$release"
    if (Test-Path -LiteralPath $stage) { throw 'Local staging folder already exists.' }
    New-Item -ItemType Directory -Path $stage | Out-Null
    git bundle create (Join-Path $stage 'source.bundle') "$old..$new"
    if ($LASTEXITCODE -ne 0) { throw 'Cannot create Git bundle.' }
    git bundle verify (Join-Path $stage 'source.bundle')
    if ($LASTEXITCODE -ne 0) { throw 'Git bundle is invalid.' }
    Compress-Archive -Path 'frontend\portal-dist\*' -DestinationPath (Join-Path $stage 'portal-dist.zip')
    Copy-Item 'zalo_bot\dist\index.mjs' (Join-Path $stage 'index.mjs')

    $botDependenciesChanged = @((git diff --name-only $old $new -- zalo_bot/package-lock.json)).Count -gt 0
    if ($botDependenciesChanged) {
        $botDeps = Join-Path $stage 'bot-deps'
        New-Item -ItemType Directory -Path $botDeps | Out-Null
        Copy-Item 'zalo_bot\package.json','zalo_bot\package-lock.json' $botDeps
        npm ci --omit=dev --prefix $botDeps --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'Cannot prepare production bot dependencies.' }
        Compress-Archive -Path "$botDeps\node_modules" -DestinationPath (Join-Path $stage 'bot-deps.zip')
    }
    $bundleHash = (Get-FileHash (Join-Path $stage 'source.bundle') -Algorithm SHA256).Hash
    $portalHash = (Get-FileHash (Join-Path $stage 'portal-dist.zip') -Algorithm SHA256).Hash
    $botHash = (Get-FileHash (Join-Path $stage 'index.mjs') -Algorithm SHA256).Hash
    $depsHash = if ($botDependenciesChanged) { (Get-FileHash (Join-Path $stage 'bot-deps.zip') -Algorithm SHA256).Hash } else { 'NONE' }
    $remoteStage = "D:/projects_production/deploy-staging/$release"
    & ssh -o BatchMode=yes $hostName "mkdir D:\projects_production\deploy-staging\$release"
    if ($LASTEXITCODE -ne 0) { throw 'Cannot create remote staging folder.' }
    foreach ($file in @('source.bundle','portal-dist.zip','index.mjs')) {
        & scp (Join-Path $stage $file) "${hostName}:$remoteStage/"
        if ($LASTEXITCODE -ne 0) { throw "Cannot transfer $file." }
    }
    if ($botDependenciesChanged) {
        & scp (Join-Path $stage 'bot-deps.zip') "${hostName}:$remoteStage/"
        if ($LASTEXITCODE -ne 0) { throw 'Cannot transfer bot dependencies.' }
    }
    & scp (Join-Path $PSScriptRoot 'remote.ps1') "${hostName}:$remoteStage/"
    if ($LASTEXITCODE -ne 0) { throw 'Cannot transfer remote deploy script.' }
    $remoteScript = "D:\projects_production\deploy-staging\$release\remote.ps1"
    & ssh -o BatchMode=yes $hostName "powershell -NoProfile -ExecutionPolicy Bypass -File $remoteScript -Release $release -Old $old -New $new -BundleHash $bundleHash -PortalHash $portalHash -BotHash $botHash -DepsHash $depsHash"
    if ($LASTEXITCODE -ne 0) { throw "Remote deploy failed. Inspect $remoteStage and the runbook before retrying." }
    $hr = Invoke-WebRequest 'https://ns.nienyi.vn/' -UseBasicParsing
    $portal = Invoke-RestMethod 'https://ktx.nienyi.vn/health'
    if ($hr.StatusCode -ne 200 -or $portal.status -ne 'ok') { throw 'External health check failed.' }
    Write-Output "DEPLOY_OK commit=$new hr=$($hr.StatusCode) portal=$($portal.status) backup=D:\projects_production\deploy-backups\NY_hr_sys_new\$release"
} finally { Pop-Location }

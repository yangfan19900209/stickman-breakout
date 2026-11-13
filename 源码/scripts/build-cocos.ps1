param(
  [string]$Creator = $env:COCOS_CREATOR,
  [ValidateSet('web-mobile','wechatgame')][string]$Platform = 'web-mobile'
)
$ErrorActionPreference = 'Stop'
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not $Creator -or -not (Test-Path -LiteralPath $Creator -PathType Leaf)) {
  throw 'Set COCOS_CREATOR to the full Cocos Creator 3.8.8 executable path, or pass -Creator.'
}
$configPath = Join-Path $projectPath "build-config\$Platform.json"
$buildMutex = New-Object System.Threading.Mutex($false, 'Local\StickmanBreakoutCreatorBuild')
$buildLockHeld = $false
try {
  try { $buildLockHeld = $buildMutex.WaitOne([TimeSpan]::FromMinutes(5)) }
  catch [System.Threading.AbandonedMutexException] { $buildLockHeld = $true }
  if (-not $buildLockHeld) { throw 'Another Creator build is still running. Retry after it finishes.' }
# Creator shares its import cache across targets; concurrent CLI builds can
# replace one another's bundles and logs, so hold one lock through preparation.
$logRoot = Join-Path (Split-Path -Parent $projectPath) '开发进度\验证记录\构建日志'
$null = New-Item -ItemType Directory -Path $logRoot -Force
$logPath = Join-Path $logRoot "build-$Platform.log"
$stdoutPath = Join-Path $logRoot "build-$Platform.stdout.log"
$stderrPath = Join-Path $logRoot "build-$Platform.stderr.log"
if (Test-Path -LiteralPath $logPath) { Remove-Item -LiteralPath $logPath -Force }
# -Wait retains the completed process exit code under Windows PowerShell 5.1.
# Waiting on the returned Process later can leave ExitCode null in that host.
$process = Start-Process -FilePath $Creator -ArgumentList @('--project', ('"' + $projectPath + '"'), '--build', ('"configPath=' + $configPath + ';logDest=' + $logPath + '"')) -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
if ($process.ExitCode -ne 36 -and $process.ExitCode -ne 0) { throw "Creator build failed ($($process.ExitCode)). See $logPath and $stderrPath" }
$entry = if ($Platform -eq 'web-mobile') { 'index.html' } else { 'game.js' }
if (-not (Test-Path -LiteralPath (Join-Path $projectPath "build\$Platform\$entry"))) { throw 'Creator exited without a build artifact.' }
$verificationLog = $logPath
if (-not (Test-Path -LiteralPath $verificationLog)) {
  # Some local editor runs cannot open project.log/logDest but still produce a
  # complete build. Accept the captured output only with an explicit finish marker.
  if (-not (Select-String -LiteralPath $stdoutPath -Pattern "build Task \($Platform\) Finished" -Quiet)) {
    throw "Creator did not produce a complete build log. See $stdoutPath and $stderrPath"
  }
  $verificationLog = $stdoutPath
}
if (Select-String -LiteralPath $verificationLog -Pattern 'Missing class|Script .+ is missing or invalid' -Quiet) { throw 'Creator produced a build with missing script classes.' }
Push-Location -LiteralPath $projectPath
try {
if ($Platform -eq 'web-mobile') {
  & node (Join-Path $projectPath 'scripts\prepare-web-shell.mjs')
  if ($LASTEXITCODE -ne 0) { throw 'Web shell packaging failed.' }
}
if ($Platform -eq 'wechatgame') {
  & node (Join-Path $projectPath 'scripts\prepare-wechat-social.mjs')
  if ($LASTEXITCODE -ne 0) { throw 'WeChat social packaging failed.' }
}
} finally { Pop-Location }
Write-Host "Creator build succeeded: build/$Platform ($($process.ExitCode))"
} finally {
  if ($buildLockHeld) { $buildMutex.ReleaseMutex() }
  $buildMutex.Dispose()
}

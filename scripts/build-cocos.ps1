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
$logPath = Join-Path $projectPath "build-$Platform.log"
$stdoutPath = Join-Path $projectPath "build-$Platform.stdout.log"
$stderrPath = Join-Path $projectPath "build-$Platform.stderr.log"
$process = Start-Process -FilePath $Creator -ArgumentList @('--project', ('"' + $projectPath + '"'), '--build', ('"configPath=' + $configPath + ';logDest=' + $logPath + '"')) -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
$process.WaitForExit()
if ($process.ExitCode -ne 36 -and $process.ExitCode -ne 0) { throw "Creator build failed ($($process.ExitCode)). See $logPath and $stderrPath" }
$entry = if ($Platform -eq 'web-mobile') { 'index.html' } else { 'game.js' }
if (-not (Test-Path -LiteralPath (Join-Path $projectPath "build\$Platform\$entry"))) { throw 'Creator exited without a build artifact.' }
Write-Host "Creator build succeeded: build/$Platform ($($process.ExitCode))"

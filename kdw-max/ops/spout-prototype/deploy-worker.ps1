# Executed by a one-shot task in the logged-in user's desktop session.
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$root='C:/KDW-Stand/prototypes/spout-v1'
$spec=Get-Content -LiteralPath ($root+'/deploy.json') -Raw | ConvertFrom-Json
function Status([string]$state,[string]$detail='') {
  @{state=$state;detail=$detail;release=$spec.releaseId;run=$spec.runId;time=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content ($root+'/deploy-status.json') -Encoding utf8
}
try {
  if($spec.releaseId -notmatch '^spout-probe-[0-9]{8}-[0-9]{6}$' -or $spec.runId -notmatch '^[a-zA-Z0-9_-]+$' -or $spec.sha256 -notmatch '^[a-fA-F0-9]{64}$'){throw 'Invalid release spec'}
  $url='https://github.com/premium-producer/MAX-Game/releases/download/'+$spec.releaseId+'/'+$spec.releaseId+'.zip'
  $archive=$root+'/'+$spec.releaseId+'.zip'
  Status 'downloading'
  if(-not(Test-Path $archive) -or (Get-FileHash $archive).Hash -ne $spec.sha256){
    $curl=Start-Process -FilePath 'curl.exe' -WindowStyle Hidden -PassThru -Wait -ArgumentList @('--silent','--show-error','--fail','--location','--connect-timeout','15','--max-time','120','--retry','3','--output',$archive,$url) -RedirectStandardError ($root+'/release-download.log')
    if($curl.ExitCode -ne 0){throw "curl release: $($curl.ExitCode)"}
  }
  if((Get-FileHash $archive).Hash -ne $spec.sha256){throw 'Release archive SHA mismatch'}
  $release=$root+'/releases/'+$spec.releaseId
  if(-not(Test-Path $release)){
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip=[IO.Compression.ZipFile]::OpenRead($archive)
    try {foreach($entry in $zip.Entries){if($entry.FullName -match '(^[/\\]|(^|[/\\])\.\.([/\\]|$)|:)'){throw 'Unsafe archive entry'}}} finally {$zip.Dispose()}
    Expand-Archive -LiteralPath $archive -DestinationPath $release
  }
  $manifest=Get-Content ($release+'/manifest.json') -Raw | ConvertFrom-Json
  if($manifest.releaseId -ne $spec.releaseId -or $manifest.electron -ne '44.4.5'){throw 'Manifest identity mismatch'}
  foreach($file in $manifest.files){
    if($file.path -match '(^[/\\]|(^|[/\\])\.\.([/\\]|$)|:)'){throw 'Unsafe manifest path'}
    $path=Join-Path $release $file.path
    if((Get-Item -LiteralPath $path).Length -ne $file.bytes -or (Get-FileHash -LiteralPath $path).Hash -ne $file.sha256){throw "File mismatch: $($file.path)"}
  }
  $runtime=$root+'/runtime/electron-44.4.5'
  if(-not(Test-Path ($runtime+'/electron.exe')) -or (Get-Content ($root+'/runtime-status.txt') -Raw).Trim() -ne 'ready'){Status 'waiting-runtime';exit 2}
  Status 'running'
  & ($release+'/run.ps1') -Seconds ([int]$spec.seconds) -Width ([int]$spec.width) -RunId $spec.runId -RuntimePath $runtime
  $result=Get-Content ($release+'/results/'+$spec.runId+'/exit.json') -Raw | ConvertFrom-Json
  if($result.senderExit -ne 0 -or $result.receiverExit -ne 0){throw "Probe failed: sender=$($result.senderExit), receiver=$($result.receiverExit)"}
  Status 'complete'
} catch {Status 'failed' ($_ | Out-String);exit 1}

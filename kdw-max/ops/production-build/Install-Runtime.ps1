param([string]$CachedRuntime='')
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtime=Join-Path $root 'runtime/electron'
$manifest=Get-Content -LiteralPath (Join-Path $root 'runtime-manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
function Verify-Runtime([string]$Directory){
 foreach($entry in $manifest.files.PSObject.Properties){
  if($entry.Name -eq 'debug.log'){continue} # Compatibility with RC2's diagnostic-log manifest entry.
  $file=Join-Path $Directory $entry.Name
  if(-not(Test-Path -LiteralPath $file) -or (Get-FileHash -LiteralPath $file).Hash -ne $entry.Value.sha256){throw "Runtime verification failed: $($entry.Name)"}
 }
}
if(Test-Path -LiteralPath $runtime){Verify-Runtime $runtime;Write-Output 'Electron runtime verified';exit 0}
New-Item -ItemType Directory -Force (Join-Path $root 'runtime') | Out-Null
if($CachedRuntime){Verify-Runtime $CachedRuntime;Copy-Item -LiteralPath $CachedRuntime -Destination $runtime -Recurse;Verify-Runtime $runtime;exit 0}
$zip=Join-Path $root 'runtime/electron-v44.4.5-win32-x64.zip'
$total=158184819L
if(-not(Test-Path -LiteralPath $zip)){[IO.File]::WriteAllBytes($zip,[byte[]]@())}
while((Get-Item -LiteralPath $zip).Length -lt $total){
 $start=(Get-Item -LiteralPath $zip).Length;$end=[Math]::Min($start+8MB-1,$total-1)
 $part=$zip+'.part';$headers=$zip+'.headers';$ok=$false
 for($attempt=0;$attempt -lt 4;$attempt++){
  $curl=Start-Process -FilePath 'curl.exe' -WindowStyle Hidden -PassThru -Wait -ArgumentList @('--silent','--show-error','--fail','--location','--connect-timeout','15','--max-time','75','--range',"$start-$end",'--dump-header',('"'+$headers+'"'),'--output',('"'+$part+'"'),'https://github.com/electron/electron/releases/download/v44.4.5/electron-v44.4.5-win32-x64.zip') -RedirectStandardError ($zip+'.log')
  if($curl.ExitCode -eq 0 -and (Get-Item -LiteralPath $part).Length -eq ($end-$start+1) -and ([IO.File]::ReadAllText($headers) -match "(?im)^content-range:\s*bytes $start-$end/$total\s*$")){$ok=$true;break}
 }
 if(-not $ok){throw "Runtime download failed at byte $start; rerun to resume"}
 $dst=[IO.File]::Open($zip,[IO.FileMode]::Append,[IO.FileAccess]::Write);$src=[IO.File]::OpenRead($part)
 try{$src.CopyTo($dst)}finally{$src.Dispose();$dst.Dispose()}
}
if((Get-FileHash -LiteralPath $zip).Hash -ne '11c395820a5aaa8ebcc0686b476d0ac98a730274ebfbdc8cf5538a7c2815cb5d'){throw 'Electron archive checksum mismatch'}
Expand-Archive -LiteralPath $zip -DestinationPath $runtime
Verify-Runtime $runtime
Write-Output 'Electron runtime installed and verified'

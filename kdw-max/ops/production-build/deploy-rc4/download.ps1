param([string]$Device)
$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue'
$base='C:/KDW-Stand/deploy/RC4-1'
$config=Get-Content -LiteralPath "$base/download-$Device.json" -Raw -Encoding UTF8|ConvertFrom-Json
function Status($phase,$asset,$bytes){@{phase=$phase;asset=$asset;bytes=$bytes;time=[DateTime]::UtcNow.ToString('o')}|ConvertTo-Json|Set-Content -LiteralPath "$base/status.json" -Encoding UTF8}
try {
 foreach($a in $config.assets){
  $zip=Join-Path $base $a.name;$total=[long]$a.bytes
  if(-not(Test-Path -LiteralPath $zip)){[IO.File]::WriteAllBytes($zip,[byte[]]@())}
  while((Get-Item -LiteralPath $zip).Length -lt $total){
   $start=(Get-Item -LiteralPath $zip).Length;$end=[Math]::Min($start+8MB-1,$total-1)
   Status 'download' $a.name $start
   $part=$zip+'.part';$headers=$zip+'.headers';$ok=$false
   for($attempt=0;$attempt -lt 5;$attempt++){
    $curl=Start-Process -FilePath 'curl.exe' -WindowStyle Hidden -PassThru -ArgumentList @('--silent','--show-error','--fail','--location','--connect-timeout','15','--max-time','75','--range',"$start-$end",'--dump-header',('"'+$headers+'"'),'--output',('"'+$part+'"'),('"'+$a.url+'"')) -RedirectStandardError ($zip+'.log')
    $null=$curl.Handle;$curl.WaitForExit()
    if($curl.ExitCode -eq 0 -and (Get-Item -LiteralPath $part).Length -eq ($end-$start+1) -and ([IO.File]::ReadAllText($headers) -match "(?im)^content-range:\s*bytes $start-$end/$total\s*$")){$ok=$true;break}
   }
   if(-not $ok){throw "Download failed: $($a.name) at $start"}
   $dst=[IO.File]::Open($zip,[IO.FileMode]::Append,[IO.FileAccess]::Write);$src=[IO.File]::OpenRead($part)
   try{$src.CopyTo($dst)}finally{$src.Dispose();$dst.Dispose()}
  }
  if((Get-Item -LiteralPath $zip).Length -ne $total -or (Get-FileHash -LiteralPath $zip).Hash -ne $a.sha256){throw "Archive hash mismatch: $($a.name)"}
  Status 'verified' $a.name $total
 }
 Status 'downloads-complete' '' 0
}catch{Status ('failed: '+$_.Exception.Message) '' 0;exit 1}

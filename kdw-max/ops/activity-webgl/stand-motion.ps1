$release='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1'
$root="$release/apps/max-game"
$folder='C:/KDW-Stand/deploy/ACTIVITY-WEBGL-20261027-1/motion'
New-Item -ItemType Directory -Force $folder|Out-Null
$user=(Get-CimInstance Win32_ComputerSystem).UserName
$samples=[Collections.Generic.List[object]]::new();$probes=@{};$errors=[Collections.Generic.List[string]]::new()
$started=[DateTime]::UtcNow;$deadline=$started.AddSeconds(180)
try {
 do {
  try {
   $s=Get-Content "$root/data/output-state.json" -Raw -Encoding UTF8|ConvertFrom-Json
   $samples.Add(@{at=[DateTime]::UtcNow.ToString('o');boot=$s.bootId;frames=$s.frames;active=$s.active;ready=$s.contentReady;lidar=$s.lidar;ui=$s.ui})
   $kind=$s.ui.activity.kind
   if($kind -in @('posts','store') -and $s.ui.activity.backend -eq 'webgl' -and -not $probes.ContainsKey($kind)) {
    $name='KDW-WebGL-Motion-'+$kind;$dest="$folder/$kind"
    if(Test-Path "$dest/receiver-summary.json"){throw "Existing probe $kind; preserve previous report"}
    $action=New-ScheduledTaskAction -Execute "$release/tools/kdw_spout_receiver.exe" -Argument "$dest 15 headless"
    $principal=New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
    Register-ScheduledTask -TaskName $name -Action $action -Principal $principal -Settings (New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries) -Force|Out-Null
    Start-ScheduledTask $name
    $probes[$kind]=@{task=$name;folder=$dest;at=[DateTime]::UtcNow.ToString('o')}
   }
  }catch{$errors.Add($_.Exception.Message)}
  if($probes.Count -eq 2 -and (Test-Path "$folder/posts/receiver-summary.json") -and (Test-Path "$folder/store/receiver-summary.json")){break}
  Start-Sleep -Milliseconds 500
 }while([DateTime]::UtcNow -lt $deadline)
 $captures=@{}
 foreach($kind in $probes.Keys){$dest=$probes[$kind].folder;$captures[$kind]=@{started=$probes[$kind].at;summary=$(if(Test-Path "$dest/receiver-summary.json"){Get-Content "$dest/receiver-summary.json" -Raw|ConvertFrom-Json}else{$null});csv=$(if(Test-Path "$dest/receiver.csv"){Get-Content "$dest/receiver.csv" -Raw}else{$null});content=$(if(Test-Path "$dest/content.json"){Get-Content "$dest/content.json" -Raw|ConvertFrom-Json}else{$null})}}
 $result=@{started=$started.ToString('o');ended=[DateTime]::UtcNow.ToString('o');samples=$samples;captures=$captures;errors=$errors;processes=@(Get-Process|Where-Object {$_.ProcessName -match 'Hokuyo|TouchDesigner'}|Select-Object ProcessName,Id)}
 $json=$result|ConvertTo-Json -Depth 18 -Compress
 [IO.File]::WriteAllText("$folder/motion.json",$json,[Text.UTF8Encoding]::new($false));$json
}finally{foreach($p in $probes.Values){Unregister-ScheduledTask -TaskName $p.task -Confirm:$false -ErrorAction SilentlyContinue}}

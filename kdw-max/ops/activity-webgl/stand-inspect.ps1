$release='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1'
$root="$release/apps/max-game"
$patches=@(Get-ChildItem 'C:/KDW-Stand/deploy' -Directory|ForEach-Object {$f=Join-Path $_.FullName 'applied.json';if(Test-Path $f){$v=Get-Content $f -Raw|ConvertFrom-Json;@{id=$_.Name;time=(Get-Item $f).LastWriteTimeUtc.ToString('o')}}}|Sort-Object time)
$hashes=@{};foreach($n in @('app.js','build.json','r9-build.json','kdw-interactions.css')){$hashes[$n]=(Get-FileHash "$root/www/webgl-v5/$n").Hash.ToLowerInvariant()}
$state=Invoke-RestMethod 'http://127.0.0.1:18752/__kdw/operator/state' -TimeoutSec 5
@{computer=$env:COMPUTERNAME;patches=$patches;hashes=$hashes;profile=(Get-Content "$root/app.json" -Raw|ConvertFrom-Json);health=(Invoke-RestMethod 'http://127.0.0.1:18752/__kdw/health' -TimeoutSec 5);state=$state;receiver=(Test-Path "$release/tools/kdw_spout_receiver.exe");processes=@(Get-Process|Where-Object {$_.ProcessName -match 'Hokuyo|TouchDesigner'}|Select-Object ProcessName,Id)}|ConvertTo-Json -Depth 20 -Compress

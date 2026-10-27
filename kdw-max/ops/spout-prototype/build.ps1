param([switch]$IncludeRuntime)
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$cache=Join-Path $root '.cache/spout-prototype'
$source=Join-Path $root 'apps/max-game/source/spout-prototype'
$sdk=Join-Path $cache 'Spout2'
$sdkCommit='6b68a5b4fdeca6130b851e5f9366467a844860e5'
$electronVersion='44.4.5'
function Check-Exit { if($LASTEXITCODE -ne 0){throw "External command failed: $LASTEXITCODE"} }
function Fetch-Verified([string]$Url,[string]$File,[string]$Hash){
  if(-not(Test-Path -LiteralPath $File)){Invoke-WebRequest $Url -OutFile $File}
  if((Get-FileHash -LiteralPath $File).Hash -ne $Hash){throw "Checksum mismatch: $File"}
}
New-Item -ItemType Directory -Force $cache,($cache+'/headers') | Out-Null
if(-not(Test-Path -LiteralPath $sdk)){
  git init $sdk; Check-Exit
  git -C $sdk remote add origin https://github.com/leadedge/Spout2.git; Check-Exit
  git -C $sdk fetch --depth 1 origin $sdkCommit; Check-Exit
  git -C $sdk checkout --detach FETCH_HEAD; Check-Exit
}
if((git -C $sdk rev-parse HEAD) -ne $sdkCommit){throw 'Spout SDK revision mismatch'}
if(git -C $sdk status --porcelain --untracked-files=no){throw 'Spout SDK has modifications'}
Fetch-Verified "https://artifacts.electronjs.org/headers/dist/v$electronVersion/node-v$electronVersion-headers.tar.gz" ($cache+'/headers.tar.gz') '3F050434F3D15188CAF71606E4CD3F7DD86547F66A72E947A2D05B39828851F6'
Fetch-Verified "https://artifacts.electronjs.org/headers/dist/v$electronVersion/win-x64/node.lib" ($cache+'/headers/node.lib') '221DAC8B3F9E9E7CABB1E782C347399B24F0A68D0778E294EE34714C59D6446E'
tar -xf ($cache+'/headers.tar.gz') -C ($cache+'/headers'); Check-Exit
cmake -S $source -B ($cache+'/build') -G 'Visual Studio 17 2022' -A x64 "-DSPOUT_ROOT=$sdk" "-DNODE_HEADERS=$cache/headers/node_headers/include/node" "-DNODE_LIB=$cache/headers/node.lib"; Check-Exit
cmake --build ($cache+'/build') --config Release --parallel 4; Check-Exit
$id='spout-probe-'+(Get-Date -Format 'yyyyMMdd-HHmmss')
$delivery=Join-Path $cache "deliveries/$id"
New-Item -ItemType Directory -Force ($delivery+'/app'),($delivery+'/licenses') | Out-Null
foreach($file in @('main.cjs','scene.html','scene.js')){Copy-Item -LiteralPath ($source+'/'+$file) -Destination ($delivery+'/app')}
Copy-Item -LiteralPath ($source+'/run.ps1') -Destination $delivery
Copy-Item -LiteralPath ($cache+'/build/Release/kdw_spout.node') -Destination ($delivery+'/app')
Copy-Item -LiteralPath ($cache+'/build/Release/kdw_spout_receiver.exe') -Destination $delivery
Copy-Item -LiteralPath ($sdk+'/LICENSE') -Destination ($delivery+'/licenses/Spout2-LICENSE')
if($IncludeRuntime){
  $runtime=Join-Path $root 'apps/max-game/runtime'
  if((Get-Content -LiteralPath ($runtime+'/version') -Raw).Trim() -ne $electronVersion){throw 'Runtime version mismatch'}
  Copy-Item -LiteralPath $runtime -Destination ($delivery+'/runtime') -Recurse
}
$files=@(Get-ChildItem -LiteralPath $delivery -File -Recurse | ForEach-Object {@{path=[IO.Path]::GetRelativePath($delivery,$_.FullName).Replace('\','/');bytes=$_.Length;sha256=(Get-FileHash -LiteralPath $_.FullName).Hash.ToLowerInvariant()}})
$sourceHashes=@(Get-ChildItem -LiteralPath $source -File | ForEach-Object {@{path=$_.Name;sha256=(Get-FileHash -LiteralPath $_.FullName).Hash.ToLowerInvariant()}})
@{schemaVersion=1;releaseId=$id;kind='isolated-spout-prototype';electron=$electronVersion;spoutCommit=$sdkCommit;spoutPatch='process-local-frame-counter';files=$files;sources=$sourceHashes} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath ($delivery+'/manifest.json') -Encoding utf8
Compress-Archive -Path ($delivery+'/*') -DestinationPath ($delivery+'.zip')
[pscustomobject]@{directory=$delivery;archive=($delivery+'.zip');sha256=(Get-FileHash -LiteralPath ($delivery+'.zip')).Hash} | ConvertTo-Json

$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$fixture=Join-Path $root ('.cache/operator-tests/'+[Guid]::NewGuid().ToString()+'/operator-integration-rc4')
New-Item -ItemType Directory -Force "$fixture/data"|Out-Null
foreach($name in @('launcher','settings')){Copy-Item -LiteralPath "$root/apps/max-game/$name" -Destination "$fixture/$name" -Recurse}
Copy-Item -LiteralPath "$root/.cache/spout-prototype/build/Release/kdw_spout.node" -Destination "$fixture/launcher/kdw_spout.node"
New-Item -ItemType Junction -Path "$fixture/www" -Target "$root/apps/max-game/www"|Out-Null
$config=Get-Content "$root/apps/max-game/app.json" -Raw|ConvertFrom-Json
$config|Add-Member -NotePropertyName output -NotePropertyValue 'spout-dual' -Force
$config.port=18854;$config.production=$true;$config.entry='/webgl-v5/client.html?backend=local&view=pixel-map'
[IO.File]::WriteAllText("$fixture/app.json",($config|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))
$lidar=@{enabled=$false;bindAddress='127.0.0.1';sourceAddress='127.0.0.1';port=19004;timeoutMs=350;width=3072;height=1536;rawPoints=$null;targetPoints=$null}
[IO.File]::WriteAllText("$fixture/data/lidar.local.json",($lidar|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
$p=Start-Process -FilePath "$root/apps/max-game/runtime/electron.exe" -ArgumentList @(('"'+$root+'/ops/production-build/operator-native.cjs"'),('"'+$fixture+'"')) -WindowStyle Hidden -PassThru -WorkingDirectory $root
$null=$p.Handle;$p.WaitForExit()
Get-Content "$fixture/native-test.json" -Raw
exit $p.ExitCode

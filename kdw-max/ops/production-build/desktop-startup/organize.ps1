$desktop=[IO.Path]::GetFullPath([Environment]::GetFolderPath('Desktop'))
if($desktop -ne $plan.desktop){throw 'Desktop changed since inventory'}
$root=[IO.Path]::GetFullPath((Join-Path $desktop 'kdw-startup'));$old=Join-Path $root 'old';$shell=New-Object -ComObject WScript.Shell
foreach($dir in @($desktop,$root,$old)){if((Test-Path -LiteralPath $dir) -and ((Get-Item -LiteralPath $dir).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Refusing redirected directory'}}
$moves=@()
foreach($item in $plan.moves){
 $src=[IO.Path]::GetFullPath($item.source);$dst=[IO.Path]::GetFullPath((Join-Path $root $item.destination))
 if((Split-Path $src) -ne $desktop -or [IO.Path]::GetExtension($src) -ne '.lnk'){throw 'Unexpected source'}
 if(-not $dst.StartsWith($root+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Destination outside startup folder'}
 if(-not(Test-Path -LiteralPath $src) -or (Test-Path -LiteralPath $dst)){throw 'Missing source or destination conflict'}
 if((Get-Item -LiteralPath $src).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Unexpected source link type'}
 $link=$shell.CreateShortcut($src);if($link.TargetPath -ne $item.target){throw 'Shortcut target changed'}
 if($item.current -and -not(Test-Path -LiteralPath $link.TargetPath)){throw 'Current launcher target missing'}
 $moves+=@{source=$src;destination=$dst;target=$link.TargetPath;current=$item.current;sha256=(Get-FileHash -LiteralPath $src).Hash}
}
New-Item -ItemType Directory -Force $root,$old|Out-Null
$record='C:/KDW-Stand/deploy/desktop-startup-20261027';New-Item -ItemType Directory -Force $record|Out-Null
$moves|ConvertTo-Json -Depth 6|Set-Content "$record/moves.json" -Encoding UTF8
foreach($m in $moves){Move-Item -LiteralPath $m.source -Destination $m.destination;if((Get-FileHash -LiteralPath $m.destination).Hash -ne $m.sha256){throw 'Moved shortcut hash mismatch'}}
$remaining=@(Get-ChildItem -LiteralPath $desktop -Filter 'KDW*.lnk' -File)
if($remaining.Count){throw 'KDW shortcuts remain on desktop'}
@{computer=$env:COMPUTERNAME;folder=$root;current=@($moves|Where-Object {$_.current}).Count;archived=@($moves|Where-Object {-not $_.current}).Count;verified=$moves.Count;desktopKdwShortcuts=$remaining.Count;currentNames=@(Get-ChildItem -LiteralPath $root -File|ForEach-Object {$_.Name});archive=$old;record="$record/moves.json"}|ConvertTo-Json -Depth 6 -Compress

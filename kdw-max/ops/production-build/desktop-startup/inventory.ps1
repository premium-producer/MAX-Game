$desktop=[Environment]::GetFolderPath('Desktop');$public=[Environment]::GetFolderPath('CommonDesktopDirectory');$shell=New-Object -ComObject WScript.Shell
$rows=@()
foreach($dir in @($desktop,$public)|Select-Object -Unique){if(-not(Test-Path -LiteralPath $dir)){continue};foreach($f in Get-ChildItem -LiteralPath $dir -Force){
 $item=@{name=$f.Name;path=$f.FullName;directory=$f.PSIsContainer;extension=$f.Extension}
 if($f.Extension -eq '.lnk'){$link=$shell.CreateShortcut($f.FullName);$item.target=$link.TargetPath;$item.workingDirectory=$link.WorkingDirectory}
 if($f.Extension -in @('.bat','.cmd')){$text=Get-Content -LiteralPath $f.FullName -Raw;$item.sha256=(Get-FileHash -LiteralPath $f.FullName).Hash;$item.relative=$text.Contains('%~dp0');$item.references=@([regex]::Matches($text,'(?i)(?:[A-Z]:[\/]|%~dp0)[^"\r\n]*?\.(?:bat|cmd|ps1|exe)')|ForEach-Object {$_.Value})}
 $rows+=$item
}}
$release='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1';$launchers=@()
foreach($dir in @($release,"$release/apps/max-game","$release/apps/stela")){$launchers+=@(Get-ChildItem -LiteralPath $dir -Filter '*.bat' -File|ForEach-Object {$_.FullName})}
@{computer=$env:COMPUTERNAME;sshUser=$env:USERNAME;interactiveUser=(Get-CimInstance Win32_ComputerSystem).UserName;desktop=$desktop;publicDesktop=$public;items=$rows;release=$release;launchers=$launchers}|ConvertTo-Json -Depth 8 -Compress

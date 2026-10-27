$ErrorActionPreference='Stop'
function Attempt($work){try{& $work}catch{@{error=$_.Exception.Message}}}
$root='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1'
$report=@{
 computer=$env:COMPUTERNAME;at=[DateTime]::UtcNow.ToString('o')
 os=Get-CimInstance Win32_OperatingSystem|Select-Object Caption,Version,BuildNumber,LastBootUpTime,FreePhysicalMemory,TotalVisibleMemorySize
 gpu=@(Get-CimInstance Win32_VideoController|Select-Object Name,Status,DriverVersion,DriverDate,ConfigManagerErrorCode,CurrentHorizontalResolution,CurrentVerticalResolution)
 display=@(Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBasicDisplayParams|Select-Object InstanceName,Active)
 sessions=(& query session 2>&1|Out-String).Trim()
 power=(& powercfg /getactivescheme 2>&1|Out-String).Trim()
 sleep=(& powercfg /query SCHEME_CURRENT SUB_SLEEP 2>&1|Out-String).Trim()
 monitorPower=(& powercfg /query SCHEME_CURRENT SUB_VIDEO 2>&1|Out-String).Trim()
 disk=Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"|Select-Object FreeSpace,Size
 devices=@(Get-CimInstance Win32_PnPEntity|Where-Object {$_.ConfigManagerErrorCode -ne 0}|Select-Object Name,ConfigManagerErrorCode)
 gpuPreferences=Attempt {Get-ItemProperty HKCU:/Software/Microsoft/DirectX/UserGpuPreferences|Select-Object * -ExcludeProperty PS*}
 gpuSystem=Attempt {Get-ItemProperty HKLM:/SYSTEM/CurrentControlSet/Control/GraphicsDrivers|Select-Object HwSchMode,TdrDelay,TdrDdiDelay,TdrLevel}
 pendingReboot=@{cbs=(Test-Path 'HKLM:/SOFTWARE/Microsoft/Windows/CurrentVersion/Component Based Servicing/RebootPending');update=(Test-Path 'HKLM:/SOFTWARE/Microsoft/Windows/CurrentVersion/WindowsUpdate/Auto Update/RebootRequired')}
 runtime=Attempt {(Get-Item "$root/runtime/electron/electron.exe").VersionInfo|Select-Object ProductVersion,FileVersion}
 recentGpuEvents=Attempt {@(Get-WinEvent -FilterHashtable @{LogName='System';StartTime=(Get-Date).AddDays(-2)} -MaxEvents 1500|Where-Object {$_.ProviderName -match 'Display|nvlddmkm|WHEA|Kernel-Power'}|Select-Object -First 20 TimeCreated,Id,ProviderName,LevelDisplayName,@{n='message';e={$_.Message.Substring(0,[Math]::Min(1600,$_.Message.Length))}})}
 applicationFaults=Attempt {@(Get-WinEvent -FilterHashtable @{LogName='Application';Id=1000,1001,1002;StartTime=(Get-Date).AddDays(-2)} -MaxEvents 30|Where-Object {$_.Message -match 'electron|kdw|TouchDesigner'}|Select-Object -First 10 TimeCreated,Id,@{n='message';e={$_.Message.Substring(0,[Math]::Min(1800,$_.Message.Length))}})}
 apps=@()
}
foreach($name in @('max-game','stela')){$app="$root/apps/$name";$config=Get-Content "$app/app.json" -Raw|ConvertFrom-Json;$report.apps+=@{name=$name;version=$config.version;output=$config.output;entry=$config.entry;bridge=(Test-Path "$app/launcher/kdw_spout.node");nativeAudio=(Test-Path "$app/launcher/audio");health=Attempt {Invoke-RestMethod "http://127.0.0.1:$($config.port)/__kdw/health" -TimeoutSec 2|Select-Object application,version,pid};runtimeDependencies=Attempt {@(Get-ChildItem "$root/runtime/electron" -File|Where-Object {$_.Name -match 'd3dcompiler|libEGL|libGLES|vulkan|vk_swiftshader'}|Select-Object Name,Length)}}}
$report|ConvertTo-Json -Depth 7 -Compress

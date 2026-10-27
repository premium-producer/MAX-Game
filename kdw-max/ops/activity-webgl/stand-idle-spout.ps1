$readyDeadline=[DateTime]::UtcNow.AddSeconds(35)
do {try{$o=(Invoke-RestMethod http://127.0.0.1:18752/__kdw/operator/state -TimeoutSec 2).output;if($o.armed -and $o.active){break}}catch{};Start-Sleep -Milliseconds 500}while([DateTime]::UtcNow -lt $readyDeadline)
if(-not $o.armed -or -not $o.active){throw 'Input not restored'}
$release='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1'
$folder='C:/KDW-Stand/deploy/ACTIVITY-WEBGL-20261027-1/idle-verification'
$name='KDW-WebGL-Idle-Verify-20261027'
$user=(Get-CimInstance Win32_ComputerSystem).UserName;if(-not $user){throw 'No interactive user'}
$action=New-ScheduledTaskAction -Execute "$release/tools/kdw_spout_receiver.exe" -Argument "$folder 10 headless"
$principal=New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
try {
 Register-ScheduledTask -TaskName $name -Action $action -Principal $principal -Settings (New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries) -Force|Out-Null
 Start-ScheduledTask $name
 $deadline=[DateTime]::UtcNow.AddSeconds(25)
 do{Start-Sleep -Milliseconds 500;if(Test-Path "$folder/receiver-summary.json"){break}}while([DateTime]::UtcNow -lt $deadline)
 $summary=Get-Content "$folder/receiver-summary.json" -Raw|ConvertFrom-Json
 if(-not $summary.completed){throw 'Probe incomplete'}
 Add-Type -AssemblyName System.Drawing
 Add-Type -TypeDefinition 'public static class KdwSwap { public static void Run(byte[] b) { for(int i=0;i<b.Length;i+=4){byte t=b[i];b[i]=b[i+2];b[i+2]=t;} } }'
 $meta=Get-Content "$folder/content.json" -Raw|ConvertFrom-Json
 $bytes=[IO.File]::ReadAllBytes("$folder/content.raw")
 if($meta.dxgiFormat -eq 28){[KdwSwap]::Run($bytes)}elseif($meta.dxgiFormat -ne 87){throw "Unsupported format $($meta.dxgiFormat)"}
 $bmp=[Drawing.Bitmap]::new($meta.width,$meta.height,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
 $rect=[Drawing.Rectangle]::new(0,0,$meta.width,$meta.height)
 $bits=$bmp.LockBits($rect,[Drawing.Imaging.ImageLockMode]::WriteOnly,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
 [Runtime.InteropServices.Marshal]::Copy($bytes,0,$bits.Scan0,$bytes.Length)
 $bmp.UnlockBits($bits)
 $bmp.Save("$folder/content.png",[Drawing.Imaging.ImageFormat]::Png);$bmp.Dispose()
 @{summary=$summary;meta=$meta;output=(Invoke-RestMethod http://127.0.0.1:18752/__kdw/operator/state -TimeoutSec 3).output}|ConvertTo-Json -Depth 8 -Compress
}finally {Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue}






param([Parameter(Mandatory=$true)][string]$Id)
$ErrorActionPreference='Stop'
if($Id -notmatch '^[a-z0-9-]+$'){throw 'Invalid snapshot ID'}
$source='C:/KDW-Stand'
$output="$source/final-snapshots/$Id"
if(Test-Path -LiteralPath "$output/manifest.json"){throw 'Snapshot already exists'}
New-Item -ItemType Directory -Path $output -Force|Out-Null
$known=Get-Content -LiteralPath "$output/known.json" -Raw|ConvertFrom-Json
$knownSet=New-Object 'System.Collections.Generic.HashSet[string]'
foreach($hash in $known){[void]$knownSet.Add($hash)}
Add-Type -AssemblyName System.IO.Compression
Add-Type -TypeDefinition @'
using System;using System.IO;using System.Security.Cryptography;
public static class StandCapture {
 public static string[] Copy(string source,string destination) {
  using(var input=new FileStream(source,FileMode.Open,FileAccess.Read,FileShare.ReadWrite|FileShare.Delete))
  using(var output=new FileStream(destination,FileMode.Create,FileAccess.Write,FileShare.None))
  using(var sha=SHA256.Create()) {
   long length=input.Length,left=length;var buffer=new byte[1024*1024];
   while(left>0){int n=input.Read(buffer,0,(int)Math.Min(buffer.Length,left));if(n==0)throw new IOException("Source truncated during capture");output.Write(buffer,0,n);sha.TransformBlock(buffer,0,n,buffer,0);left-=n;}
   sha.TransformFinalBlock(new byte[0],0,0);
   return new[]{BitConverter.ToString(sha.Hash).Replace("-","").ToLowerInvariant(),length.ToString(),(input.Length!=length).ToString()};
  }
 }
}
'@
$started=[DateTime]::UtcNow.ToString('o')
$files=New-Object 'System.Collections.Generic.List[object]'
$errors=New-Object 'System.Collections.Generic.List[object]'
$roots=@(@{path=$source;prefix='stand'})
$desktop=Join-Path ([Environment]::GetFolderPath('Desktop')) 'kdw-startup'
if(Test-Path -LiteralPath $desktop){$roots+=@{path=$desktop;prefix='desktop/kdw-startup'}}
$seen=New-Object 'System.Collections.Generic.HashSet[string]'
$parts=New-Object 'System.Collections.Generic.List[object]'
$state=@{zip=$null;stream=$null;parts=$parts;name=$null};$part=0;$partBytes=0;$pending="$output/object.part"
function Close-Part {
 if($state.zip){$state.zip.Dispose();$state.stream.Dispose();$state.parts.Add(@{name=$state.name;bytes=(Get-Item -LiteralPath "$output/$($state.name)").Length;sha256=(Get-FileHash -LiteralPath "$output/$($state.name)" -Algorithm SHA256).Hash.ToLowerInvariant()});$state.zip=$null}
}
foreach($root in $roots){
 $queue=New-Object 'System.Collections.Generic.Queue[string]';$queue.Enqueue($root.path)
 while($queue.Count){
  $dir=$queue.Dequeue()
  foreach($item in Get-ChildItem -LiteralPath $dir -Force){
   if($root.prefix -eq 'stand' -and $dir -eq $source -and $item.Name -eq 'final-snapshots'){continue}
   $rel=$root.prefix+'/'+$item.FullName.Substring($root.path.Length).TrimStart('\','/').Replace('\','/')
   if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){$errors.Add(@{path=$rel;reason='reparse-point-not-followed'});continue}
   if($item.PSIsContainer){$queue.Enqueue($item.FullName);continue}
   try{
    $capture=[StandCapture]::Copy($item.FullName,$pending)
    $hash=$capture[0];$size=[long]$capture[1]
    $files.Add(@{path=$rel;sha256=$hash;bytes=$size;lastWriteUtc=$item.LastWriteTimeUtc.ToString('o');grewDuringRead=($capture[2] -eq 'True')})
    if(-not $seen.Add($hash) -or $knownSet.Contains($hash)){continue}
    if($state.zip -and $partBytes -ge 134217728){Close-Part}
    if(-not $state.zip){$part++;$partName=('objects-{0:D3}.zip' -f $part);$state.name=$partName;$state.stream=[IO.File]::Open("$output/$partName",[IO.FileMode]::CreateNew);$state.zip=[IO.Compression.ZipArchive]::new($state.stream,[IO.Compression.ZipArchiveMode]::Create);$partBytes=0}
    $entry=$state.zip.CreateEntry("objects/$hash",[IO.Compression.CompressionLevel]::Fastest)
    $dest=$entry.Open();$input=[IO.File]::OpenRead($pending)
    try{$input.CopyTo($dest)}finally{$input.Dispose();$dest.Dispose()}
    $partBytes+=$size
   }catch{$errors.Add(@{path=$rel;reason=$_.Exception.Message})}
  }
 }
}
Close-Part
if(Test-Path -LiteralPath $pending){Remove-Item -LiteralPath $pending}
$health=@()
foreach($port in @(18751,18752)){try{$health+=@{port=$port;health=(Invoke-RestMethod "http://127.0.0.1:$port/__kdw/health" -TimeoutSec 2);screen=(Invoke-RestMethod "http://127.0.0.1:$port/__kdw/screen/state" -TimeoutSec 2)}}catch{$health+=@{port=$port;error=$_.Exception.Message}}}
$manifest=@{schemaVersion=1;id=$Id;computer=$env:COMPUTERNAME;startedUtc=$started;completedUtc=[DateTime]::UtcNow.ToString('o');capture='Live file-level capture; each file bounded at opening length, not an atomic database snapshot';roots=$roots;files=$files.ToArray();errors=$errors.ToArray();archives=$parts.ToArray();health=$health}
[IO.File]::WriteAllText("$output/manifest.json",($manifest|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))
@{id=$Id;computer=$env:COMPUTERNAME;files=$files.Count;errors=$errors.Count;uniqueObjects=$seen.Count;archives=$parts.ToArray();manifest="$output/manifest.json"}|ConvertTo-Json -Depth 5 -Compress

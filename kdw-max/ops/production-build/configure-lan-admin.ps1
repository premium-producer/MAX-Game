param([string]$Release='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1')
$ErrorActionPreference='Stop'
$addresses=@(Get-NetIPAddress -AddressFamily IPv4|Where-Object {$_.IPAddress -match '^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)'}|Select-Object -ExpandProperty IPAddress -Unique)
if(-not $addresses.Count){throw 'No private LAN IPv4 address'}
$result=@()
foreach($name in @('max-game','stela')){
 $root=Join-Path $Release "apps/$name";$directory=Join-Path $root 'data/lan-admin';New-Item -ItemType Directory -Force -Path $directory|Out-Null
 $configFile=Join-Path $directory 'config.json';$pfxFile=Join-Path $directory 'server.pfx'
 if(-not(Test-Path -LiteralPath $configFile) -or -not(Test-Path -LiteralPath $pfxFile)){
  $san='DNS='+$env:COMPUTERNAME+'&DNS=localhost&IPAddress=127.0.0.1';foreach($ip in $addresses){$san+='&IPAddress='+$ip}
  $cert=New-SelfSignedCertificate -Type Custom -Subject "CN=KDW $env:COMPUTERNAME admin" -CertStoreLocation 'Cert:/CurrentUser/My' -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 -KeyExportPolicy Exportable -KeyUsage DigitalSignature,KeyEncipherment -TextExtension @("2.5.29.17={text}$san",'2.5.29.37={text}1.3.6.1.5.5.7.3.1') -NotAfter (Get-Date).AddYears(2)
  $random=New-Object byte[] 32;[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($random);$password=[Convert]::ToBase64String($random)
  Export-PfxCertificate -Cert $cert -FilePath $pfxFile -Password (ConvertTo-SecureString $password -AsPlainText -Force)|Out-Null
  [IO.File]::WriteAllText($configFile,(@{enabled=$true;passphrase=$password}|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
 }
 $port=if($name -eq 'max-game'){18762}else{18761};$rule='KDW LAN admin '+$name
 if(-not(Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue)){New-NetFirewallRule -DisplayName $rule -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port -RemoteAddress LocalSubnet -Profile Any|Out-Null}
 $result+=@{app=$name;port=$port;addresses=$addresses;configured=$true}
}
@{computer=$env:COMPUTERNAME;apps=$result}|ConvertTo-Json -Depth 6 -Compress

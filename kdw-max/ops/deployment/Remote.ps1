param([Parameter(Mandatory=$true)][ValidateSet('ssh','scp')][string]$Tool,[Parameter(ValueFromRemainingArguments=$true)][string[]]$RemoteArguments)
$ErrorActionPreference='Stop'
$private=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../private/deployment/ssh'))
$options=@('-F',(Join-Path $private 'config'),'-i',(Join-Path $private 'selectel_vds_ed25519'),'-o',('UserKnownHostsFile='+ (Join-Path $private 'selectel_known_hosts')))
& "$Tool.exe" @options @RemoteArguments
exit $LASTEXITCODE

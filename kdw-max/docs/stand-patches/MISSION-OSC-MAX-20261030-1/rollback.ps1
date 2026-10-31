$ErrorActionPreference='Stop'
if($env:COMPUTERNAME -ne 'DESKTOP-64J4BMN'){throw 'WRONG_HOST'}
if((Get-FileHash 'C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1/apps/max-game/launcher/game-state-osc.cjs').Hash.ToLowerInvariant() -ne 'b84dc85945f9d29b730cc303f583bb1fdb605079a19329aeba472d0bb19ad7d3'){throw 'NEWER_FILE_OR_ALREADY_ROLLED_BACK'}
if((Get-FileHash 'C:/KDW-Stand/deploy/MISSION-OSC-MAX-20261030-1/mission-osc.previous.cjs').Hash.ToLowerInvariant() -ne '069ecb21b38b5f5412d98d65e6f177613cfccf6bbd68fa19f6cbd56bcfeeeb53'){throw 'BACKUP_HASH_MISMATCH'}
Copy-Item -LiteralPath 'C:/KDW-Stand/deploy/MISSION-OSC-MAX-20261030-1/mission-osc.previous.cjs' -Destination 'C:/KDW-Stand/deploy/MISSION-OSC-MAX-20261030-1/mission-osc.rollback.cjs'
[IO.File]::Replace('C:/KDW-Stand/deploy/MISSION-OSC-MAX-20261030-1/mission-osc.rollback.cjs','C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1/apps/max-game/launcher/game-state-osc.cjs','C:/KDW-Stand/deploy/MISSION-OSC-MAX-20261030-1/mission-osc.removed.cjs')
if((Get-FileHash 'C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1/apps/max-game/launcher/game-state-osc.cjs').Hash.ToLowerInvariant() -ne '069ecb21b38b5f5412d98d65e6f177613cfccf6bbd68fa19f6cbd56bcfeeeb53'){throw 'ROLLBACK_HASH_MISMATCH'}
Write-Output 'Previous module restored on disk. No processes restarted. Takes effect at next full MAX start.'

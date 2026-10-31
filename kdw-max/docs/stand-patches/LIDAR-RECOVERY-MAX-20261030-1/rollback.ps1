$ErrorActionPreference='Stop'
if($env:COMPUTERNAME -ne 'DESKTOP-64J4BMN'){throw 'WRONG_HOST'}
if((Get-FileHash 'C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1/apps/max-game/launcher/lidar.cjs').Hash.ToLowerInvariant() -ne '38d21cc4b3b1134c8813563c71ffd6047af669a2be76d893b0f49066c33fc4cb'){throw 'NEWER_FILE_OR_ALREADY_ROLLED_BACK'}
if((Get-FileHash 'C:/KDW-Stand/deploy/LIDAR-RECOVERY-MAX-20261030-1/lidar.previous.cjs').Hash.ToLowerInvariant() -ne 'a88cb573c85b6efbf26875269b49a82389bbabce68b634d84e3f22884eaa4378'){throw 'BACKUP_HASH_MISMATCH'}
Copy-Item -LiteralPath 'C:/KDW-Stand/deploy/LIDAR-RECOVERY-MAX-20261030-1/lidar.previous.cjs' -Destination 'C:/KDW-Stand/deploy/LIDAR-RECOVERY-MAX-20261030-1/lidar.rollback.cjs'
[IO.File]::Replace('C:/KDW-Stand/deploy/LIDAR-RECOVERY-MAX-20261030-1/lidar.rollback.cjs','C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1/apps/max-game/launcher/lidar.cjs','C:/KDW-Stand/deploy/LIDAR-RECOVERY-MAX-20261030-1/lidar.removed.cjs')
if((Get-FileHash 'C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1/apps/max-game/launcher/lidar.cjs').Hash.ToLowerInvariant() -ne 'a88cb573c85b6efbf26875269b49a82389bbabce68b634d84e3f22884eaa4378'){throw 'ROLLBACK_HASH_MISMATCH'}
Write-Output 'Previous module restored on disk. No processes restarted. Takes effect at next full MAX start.'

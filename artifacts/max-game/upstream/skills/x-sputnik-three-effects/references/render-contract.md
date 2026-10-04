# Render contract

## Persistent scene

The same WebGL world serves `cta`, `onboarding`, `missions`, `game`, and `end`. Screen state changes visibility, mask, camera target, blur/dim and effect presets; it does not reconstruct the Earth.

## Layer responsibilities

| Layer | Owns | Must not own |
|---|---|---|
| Earth | globe meshes, textures, atmosphere, Russia contour | mission status or route validity |
| Geographic markers | projection, surface bases, stems and labels | mission unlocking |
| Nodes | visual state parameters, icon, waves, local feedback | deciding neighbors or correct order |
| Links | geometry for accepted left/right connections, packet progress | finding additional hidden connections |
| Post FX | color grade and short event feedback | persistent gameplay information |
| Camera | constrained presentation and smooth settle | object placement data |

## Surface and orbital behavior

- A/Б and ground nodes anchor to the true Earth surface, not an arbitrary shell above it.
- Bases conform visually to the sphere. Stems/icons keep the established readable screen-up orientation.
- Orbital objects use a separate pointer-to-3D mapping with minimum altitude and visibility limits.
- Preserve the pointer grab offset for every draggable part so pickup never teleports.

## Effect semantics

- Drop: tangent impact ring and short particles at the final authoritative position.
- Waking: continuous fade/scale/emissive ramp.
- Searching: waves communicate individual radius; no link until radii and neighbor rules pass.
- Connected: grow the accepted curve and send packets along it.
- Wrong: short local red/error mix; never obscure the whole map.
- Success: illuminate A→route→Б, then trigger the success UI.

## Portability and lifecycle

- Resolve assets relative to the application.
- Avoid runtime network fetches other than local config/assets.
- Resize only on actual viewport changes.
- Do not allocate vectors, arrays, materials or geometries during ordinary frames or pointer moves.
- Maintain a disposal path for temporary render targets, geometries, materials and textures.

# Infinity Image Generator

Infinity Image Generator is the shared visual-production layer for the Infinity network. It connects the 3D World studio, Infinity Graphics, vector design, user-created worlds, and every product site that needs images, scenes, themes, cards, covers, diagrams, interfaces, or reusable design assets.

It is not meant to be another isolated image page. It should operate as a common design service that other Infinity applications can open inside the single-page experience.

## Connected studios

- `www-infinity4/3d-world` — 3D scenes, objects, materials, lighting, cameras, environments, and interactive worlds.
- `www-infinity4/Infinity-Graphics` — 2D graphics, layouts, typography, compositing, branding, posters, cards, diagrams, and reusable interface assets.
- `www-infinity4/GPT-Vector-Design` — editable vector shapes, logos, icons, paths, masks, and scalable exports.
- `www-infinity4/Image-Generator` — prompt interpretation, generation jobs, variations, asset manifests, quality review, and delivery to other sites.

## Shared creation flow

```text
User idea or five-word vector
        ↓
C13b0 action interpreter
        ↓
Design brief and tokenized action plan
        ↓
Image Generator chooses the required studio
        ↓
2D graphics, vector assets, 3D objects, or mixed scene
        ↓
Preview and small ⭐ edit portals
        ↓
Named versions and reversible history
        ↓
Approved asset package
        ↓
Use in StarQuest, Alien Coin, Bitcoin Crusher, Alien Radio, or another Infinity world
```

## Core principle

Every strong advancement should become a reusable capability instead of remaining trapped inside one repository.

A finished visual feature should be packageable as:

- a theme,
- a component,
- a scene,
- a model,
- a material,
- a font configuration,
- a card or cover template,
- a chart or diagram style,
- an animation,
- an image-generation recipe,
- or a complete world design.

## Asset manifest

Every generated or edited asset should have a permanent record.

```json
{
  "assetId": "asset_01J...",
  "creatorId": "user_01J...",
  "sourceProject": "Infinity-Graphics",
  "assetType": "world_theme",
  "displayName": "Moon Dust Entertainment Theme",
  "version": 4,
  "parentAssetId": null,
  "prompt": "space cinema with silver dust and close app controls",
  "tools": ["image-generator", "graphics-studio"],
  "formats": ["png", "svg", "webp", "json-theme"],
  "width": 1600,
  "height": 900,
  "rightsStatus": "user_created",
  "integrityHash": "sha256:...",
  "createdAt": 0
}
```

## Required capabilities

### Image Generator

- Text-to-image and image-to-image job preparation.
- Variations, crops, resizing, background removal, and approved style controls.
- Prompt history and reproducible generation settings.
- Comparison view for candidate images.
- Quality checks for dimensions, transparency, text legibility, and duplicate output.
- Export packages for web, mobile, cards, social posts, and print.

### Infinity Graphics

- Layer-based 2D editor.
- Text, fonts, gradients, borders, masks, shapes, and image placement.
- Templates for StarQuest worlds, Alien Coins, trading cards, album covers, research graphics, charts, and coupons.
- Responsive layout export for other Infinity applications.
- Component and theme library.

### 3D World

- Scene graph and object hierarchy.
- Camera, light, material, texture, and environment controls.
- Import and export of practical web formats such as glTF/GLB.
- Product turntables, world previews, virtual galleries, coin displays, stages, and interactive rooms.
- Lightweight previews for Android and lower-powered devices.

## Small ⭐ edit portals

Editable visual elements should display the small ⭐ control used across Infinity.

Examples:

- Title ⭐
- Font ⭐
- Background ⭐
- Character ⭐
- Camera ⭐
- Lighting ⭐
- Material ⭐
- Layout ⭐
- Animation ⭐

Opening the control shows only the settings relevant to that element. Saving creates a new version rather than destroying the previous design.

## Cross-site delivery

Other Infinity sites should request assets through a shared contract instead of copying random files between repositories.

```json
{
  "requestId": "design_request_01J...",
  "targetApp": "StarQuest",
  "targetWorldId": "world_01J...",
  "requestedTypes": ["hero_image", "theme", "mobile_icon"],
  "brief": "Fishing entertainment world with river colors and close app styling",
  "status": "draft",
  "createdBy": "user_01J..."
}
```

The completed response should return asset IDs, formats, dimensions, rights information, version numbers, and usage instructions.

## Qualified advancements

A capability is ready to spread to other sites only when it is:

1. Functional.
2. Reusable.
3. Responsive on mobile.
4. Accessible.
5. Versioned.
6. Documented.
7. Tested without arbitrary script injection.
8. Exportable through a stable asset manifest or component interface.

The system should promote these qualified advancements into a shared library. Experimental features remain marked as experimental until they pass the checks.

## Security and rights

- Never place provider secrets or model keys in browser code.
- Generation requests must be authorized server-side.
- Uploaded files require type, size, and malware validation.
- Do not permit arbitrary executable uploads.
- Preserve creator attribution and source-image rights.
- A generated image does not automatically grant rights to protected logos, characters, people, movies, or music.
- Store immutable asset IDs and append-only version history.
- Copying an asset file does not transfer its Infinity ownership, license, or ledger identity.

## First build milestone

Create a mobile-first Design Dock with:

1. A prompt or five-word-vector input.
2. Output type selection: image, graphic, vector, 3D scene, theme, or complete package.
3. Automatic routing to the correct studio.
4. Candidate preview gallery.
5. Small ⭐ edit controls.
6. Named versions and restore.
7. An asset manifest inspector.
8. A `Use in another Infinity site` action.

## Status

This branch establishes the shared architecture. Production generation, storage, authentication, rights checking, and cross-site delivery still need implementation and testing before the service can be treated as operational.

## Why

The desktop app already stores downloaded character images and failed image records, but the `图片资源` navigation entry still falls back to a placeholder page. Users currently have no focused way to browse local image assets, filter by character, or review failed downloads without drilling into each character detail one by one.

## What Changes

- Implement a dedicated `图片资源` page in the renderer instead of the current placeholder view.
- Add image-oriented summary statistics and filtering for characters with downloaded or failed images.
- Reuse existing character JSON data to show grouped image previews by character and avoid creating a second source of truth.
- Add a dedicated failed-image review area with quick actions to open the related image folder or jump to character detail.
- Keep heavy image preview data lazy-loaded so the page remains responsive with larger datasets.

## Capabilities

### New Capabilities
- `image-manager`: Browse downloaded character images and failed image records from a dedicated desktop UI page.

### Modified Capabilities

## Impact

- Renderer routing in `src/renderer/src/components/AppLayout.tsx`
- New renderer route/components/store for the image manager page
- Reuse of existing `characters:list`, `characters:detail`, and `file:openPath` APIs
- No crawler, export, or storage format changes

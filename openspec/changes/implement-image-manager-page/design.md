# Design

## Scope

This change adds a dedicated renderer page for `图片资源` and keeps the existing character JSON files as the single source of truth for image data. It does not introduce new crawler output files, new persistence formats, or new image indexing jobs.

## Data Strategy

The page should reuse the current two-level data flow:

1. `characters:list` for lightweight summary rows
2. `characters:detail` for full image preview data on demand

This avoids reading and base64-encoding every local image during initial page load. Summary data is already sufficient to compute:

- character count
- characters with downloaded images
- total downloaded image count
- total failed image count

When the user expands or opens a character image group, the renderer requests `characters:detail` for that character and reads:

- `images.downloaded`
- `images.download_failed`
- `imageDir`
- preview metadata already normalized by the main process

## Renderer Structure

Recommended additions:

- `src/renderer/src/routes/ImageManager.tsx`
- `src/renderer/src/components/ImageGalleryCard.tsx`
- `src/renderer/src/components/FailedImageList.tsx`
- `src/renderer/src/stores/imageStore.ts`

The `ImageManager` route should:

- load character summaries on mount
- derive summary metrics
- apply local keyword/status filtering
- request character detail lazily for visible or expanded groups

## UX Flow

### Primary path

1. User opens `图片资源`
2. Renderer loads character summaries
3. Page shows summary cards and filtered character groups
4. User expands a character group to load image previews
5. User opens the image directory or jumps to character detail as needed

### Failure review path

1. User filters to `有失败记录`
2. Page shows failed image rows grouped by character
3. User reviews URL and error message
4. User opens the related directory or character detail for follow-up

## Integration Notes

- `AppLayout` should route `activePage === 'images'` to the new page.
- The page should preserve the project's existing Ant Design + Zustand structure.
- The page should reuse `electronApi.openPath()` for folder actions.
- Character detail navigation can either reuse the existing `characterStore` drawer flow or open a lightweight local drawer inside the image page. Reusing the existing detail drawer is preferred for consistency.

## Performance Notes

- Do not fetch every `CharacterDetail` during initial page load.
- Cache fetched details by character name in the image store to avoid repeated image preview work.
- Keep filtering over summaries local in the renderer.

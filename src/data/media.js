/**
 * AUTOMATIC LOCAL GALLERY DATA
 * 
 * This file automatically scans your "Cloud" folder for images and videos.
 * No manual entry required!
 */

// 1. Auto-scan the parent Cloud directory
// Path is relative to this file: ../../../Cloud
const localFiles = import.meta.glob('../../../Cloud/*.{jpg,jpeg,png,gif,mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default'
});

// 2. Convert to the data format our App expects
export const mediaData = Object.entries(localFiles).map(([path, url], index) => {
  const filename = path.split('/').pop();
  const isVideo = filename.match(/\.(mp4|webm)$/i);
  
  return {
    id: index,
    type: isVideo ? 'video' : 'image',
    caption: filename.replace(/\.[^/.]+$/, ""), // Remove extension for clean caption
    url: url,
    driveId: null // Not needed for local files
  };
});

// Helpers (Keep for compatibility, though simplified)
export const getMediaUrl = (item) => item.url;
export const getThumbnailUrl = (item) => item.url;

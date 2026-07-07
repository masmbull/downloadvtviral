export async function downloadFile(downloadUrl: string, filename = 'video.mp4') {
  const res = await fetch(downloadUrl, {
    method: 'GET',
    headers: {
      accept: 'video/mp4,video/webm,video/*,application/octet-stream,*/*',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch media');
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('video') && !contentType.includes('octet-stream')) {
    throw new Error('Invalid media response');
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
}

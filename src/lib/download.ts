export async function downloadFile(downloadUrl: string, filename = 'video.mp4') {
  try {
    const res = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        accept: 'video/mp4,video/webm,video/*,application/octet-stream,*/*',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
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
  } catch (error) {
    console.error('Download failed:', error);
    window.open(downloadUrl, '_blank');
  }
}

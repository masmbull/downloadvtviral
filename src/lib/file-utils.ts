function detectFileExtension(
  buffer: ArrayBuffer,
  fallbackContentType: string
): { extension: string; contentType: string } {
  const bytes = new Uint8Array(buffer);

  const checks: Array<{
    position: number;
    signature: number[];
    extension: string;
    contentType: string;
  }> = [
    {
      position: 0,
      signature: [0x1a, 0x45, 0xdf, 0xa3],
      extension: 'webm',
      contentType: 'video/webm',
    },
    {
      position: 4,
      signature: [0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d],
      extension: 'mp4',
      contentType: 'video/mp4',
    },
    {
      position: 4,
      signature: [0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32],
      extension: 'mp4',
      contentType: 'video/mp4',
    },
    {
      position: 0,
      signature: [0x52, 0x49, 0x46, 0x46],
      extension: 'avi',
      contentType: 'video/x-msvideo',
    },
    {
      position: 0,
      signature: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32],
      extension: 'mp4',
      contentType: 'video/mp4',
    },
    {
      position: 0,
      signature: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32],
      extension: 'mp4',
      contentType: 'video/mp4',
    },
    {
      position: 0,
      signature: [0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11],
      extension: 'wmv',
      contentType: 'video/x-ms-wmv',
    },
  ];

  for (const check of checks) {
    if (
      bytes.length >= check.position + check.signature.length &&
      check.signature.every((byte, index) => bytes[check.position + index] === byte)
    ) {
      return { extension: check.extension, contentType: check.contentType };
    }
  }

  const ct = fallbackContentType.toLowerCase();
  if (ct.includes('webm')) return { extension: 'webm', contentType: 'video/webm' };
  if (ct.includes('mp4') || ct.includes('mpeg')) return { extension: 'mp4', contentType: 'video/mp4' };
  if (ct.includes('mov')) return { extension: 'mov', contentType: 'video/quicktime' };
  if (ct.includes('avi')) return { extension: 'avi', contentType: 'video/x-msvideo' };
  if (ct.includes('octet-stream')) return { extension: 'bin', contentType: 'application/octet-stream' };

  return { extension: 'mp4', contentType: 'video/mp4' };
}

export function getDownloadFilename(
  baseName: string,
  buffer: ArrayBuffer,
  contentType: string
): string {
  const sanitizedBase = baseName
    .replace(/[^a-zA-Z0-9\s\-_.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);

  const { extension } = detectFileExtension(buffer, contentType);

  return `${sanitizedBase || 'video'}.${extension}`;
}

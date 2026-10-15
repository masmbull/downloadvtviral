import dns from 'node:dns/promises';
import net from 'node:net';

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fe80')) return true; // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    if (lower.startsWith('::ffff:')) return isPrivateIp(lower.slice(7));
    return false;
  }
  return false;
}

/**
 * True only for a public http(s) URL. Blocks non-http(s) schemes,
 * loopback/private/link-local/reserved hosts, and hostnames resolving to them.
 * Used to keep the download proxy from becoming an SSRF / internal-port scanner.
 */
export async function isPublicHttpUrl(rawUrl: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

  const host = parsed.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.localhost')) return false;

  if (net.isIP(host)) return !isPrivateIp(host);

  let addresses: string[];
  try {
    const records = await dns.lookup(host, { all: true });
    addresses = records.map((r) => r.address);
  } catch {
    return false;
  }
  if (addresses.length === 0) return false;
  return addresses.every((addr) => !isPrivateIp(addr));
}
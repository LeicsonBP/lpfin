import { headers } from 'next/headers';

/**
 * Origem pública da aplicação (usada nos redirects do OAuth).
 * Funciona em localhost e na Vercel (x-forwarded-*).
 */
export async function getOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000';
  const forwardedProto = headerList.get('x-forwarded-proto');
  const proto = forwardedProto ?? (host.startsWith('localhost') ? 'http' : 'https');

  return `${proto}://${host}`;
}

import { NextRequest } from 'next/server';
import { handleOgGet } from './handler';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  return handleOgGet(request, 'og');
}

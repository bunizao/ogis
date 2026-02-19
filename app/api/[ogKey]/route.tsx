import { NextRequest } from 'next/server';
import { handleOgGet } from '../og/handler';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ogKey: string }> }
) {
  const { ogKey } = await context.params;
  return handleOgGet(request, ogKey);
}

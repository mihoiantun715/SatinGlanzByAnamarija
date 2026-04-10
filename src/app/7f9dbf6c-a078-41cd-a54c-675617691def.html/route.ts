import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('7f9dbf6c-a078-41cd-a54c-675617691def', {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

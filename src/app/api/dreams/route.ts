import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const dreams = await db.dream.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ dreams });
  } catch (error) {
    console.error('Fetch dreams error:', error);
    return NextResponse.json(
      { error: '获取梦境列表失败' },
      { status: 500 }
    );
  }
}

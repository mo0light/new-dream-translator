import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dream = await db.dream.findUnique({
      where: { id },
    });

    if (!dream) {
      return NextResponse.json(
        { error: '梦境不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ dream });
  } catch (error) {
    console.error('Fetch dream error:', error);
    return NextResponse.json(
      { error: '获取梦境详情失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if dream exists
    const existing = await db.dream.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: '梦境不存在' },
        { status: 404 }
      );
    }

    await db.dream.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete dream error:', error);
    return NextResponse.json(
      { error: '删除梦境失败' },
      { status: 500 }
    );
  }
}

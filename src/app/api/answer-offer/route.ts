// app/api/answer-offer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addAnswer } from '@/lib/store';

export async function POST(req: NextRequest) {
    const { callId, answer } = await req.json();

    await addAnswer(callId, answer);

    return NextResponse.json({ status: 'success' });
}

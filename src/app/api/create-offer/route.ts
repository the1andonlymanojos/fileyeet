// app/api/create-offer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createCall } from '@/lib/store';

export async function POST(req: NextRequest) {
    const callId = uuidv4();
    const { offer } = await req.json();

    await createCall(callId, offer);

    return NextResponse.json({ callId });
}

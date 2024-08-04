// app/api/get-call/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCall } from '@/lib/store';

export async function POST(req: NextRequest) {
    const { callId } = await req.json();
    console.log("callId", callId);
    const callData = await getCall(callId);
    console.log("callData", callData);
    return NextResponse.json(callData);
}

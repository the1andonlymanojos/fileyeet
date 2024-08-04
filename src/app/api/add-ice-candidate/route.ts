// app/api/add-ice-candidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addCandidate } from '@/lib/store';
import {lookaheadType} from "sucrase/dist/types/parser/tokenizer";

export async function POST(req: NextRequest) {
    const { callId, candidate, type } = await req.json();
    console.log("Received POST, Candidate:", candidate);
    await addCandidate(callId, candidate, type);

    return NextResponse.json({ status: 'success' });
}

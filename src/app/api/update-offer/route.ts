// app/api/create-offer/route.ts
import { NextRequest, NextResponse } from "next/server";
//import { v4 as uuidv4 } from 'uuid';
import { createCall, updateCall } from "@/lib/store";

export async function POST(req: NextRequest) {
  const { callId, offer } = await req.json();
  console.log("callId", callId);

  await updateCall(callId, offer);

  return NextResponse.json({ callId });
}

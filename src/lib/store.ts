import redis from "./redisClient";
import exp from "node:constants";

type Candidate = {
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
};

type Call = {
  offer: RTCSessionDescriptionInit;
  answer: RTCSessionDescriptionInit | null;
  offerCandidates: Candidate[];
  answerCandidates: Candidate[];
};

const getCandidates = async (
  callId: string,
  type: "offer" | "answer",
): Promise<Candidate[]> => {
  const candidateKey = `${callId}:${type}Candidates`;
  const candidatesData = await redis.lrange(candidateKey, 0, -1);
  return candidatesData.map((candidate) => JSON.parse(candidate) as Candidate);
};

export const createCall = async (
  callId: string,
  offer: RTCSessionDescriptionInit,
): Promise<void> => {
  console.log("Creating call", callId);
  const call: Call = {
    offer,
    answer: null,
    offerCandidates: [],
    answerCandidates: [],
  };
  await redis.set(callId, JSON.stringify(call));
  console.log("Stored call: ", call);
};

export const updateCall = async (
  callId: string,
  offer: RTCSessionDescriptionInit,
): Promise<void> => {
  const call = await getCall(callId);
  if (call) {
    call.offer = offer;
    await redis.set(callId, JSON.stringify(call));
  }
};

export const getCall = async (callId: string): Promise<Call | null> => {
  const callData = await redis.get(callId);
  if (callData) {
    const call = JSON.parse(callData) as Call;
    call.offerCandidates = await getCandidates(callId, "offer");
    call.answerCandidates = await getCandidates(callId, "answer");
    return call;
  }
  return null;
};

export const addAnswer = async (
  callId: string,
  answer: RTCSessionDescriptionInit,
): Promise<void> => {
  const call = await getCall(callId);
  if (call) {
    call.answer = answer;
    await redis.set(callId, JSON.stringify(call));
  }
};

export const addCandidate = async (
  callId: string,
  candidate: Candidate,
  type: "offer" | "answer",
): Promise<void> => {
  const candidateKey = `${callId}:${type}Candidates`;
  await redis.rpush(candidateKey, JSON.stringify(candidate));
};

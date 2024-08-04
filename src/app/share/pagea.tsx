// app/pagea.tsx
"use client"

import {useEffect, useRef, useState} from "react";

export default function ShareBox() {

    let callId:string;
    const pc = useRef<RTCPeerConnection | null>(null);
    const data_channel = useRef<RTCDataChannel | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            pc.current = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                iceCandidatePoolSize: 10
            });
            pc.current.ondatachannel = (e)=>{
                e.channel.onopen = (e)=>{
                    console.log("Listening to peer")
                }
                e.channel.onmessage = (e)=>{
                    console.log("Message from peer: "+e.data)
                }
            }
            data_channel.current = pc.current.createDataChannel("DATA");
            data_channel.current.onopen = (e) => {
                console.log("Connection opened" )
            }
            data_channel.current.onmessage = (e)=>{
                console.log("Received message: ", e.data);
            }
        }
    }, []);

    const handleNewICECandidate = async (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
            console.log("Event.Candidate", event.candidate);
            console.log("CallId", callId)
            await fetch('/api/add-ice-candidate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callId,
                    candidate: event.candidate.toJSON(),
                    type: 'offer'
                })
            });
        }
    };

    async function handleStartCall() {
        if (pc.current){
            pc.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
                handleNewICECandidate(event); // console.log("New Ice Candidate: ", event.candidate?.toJSON());
            };
            const offerDescription = await pc.current?.createOffer();
            const response = await fetch('/api/create-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offer: offerDescription })
            });
            await pc.current?.setLocalDescription(offerDescription);
            const data = await response.json();
            console.log(data);
            callId = data.callId;
        }
    }


    return (
        <div>
            <h1>P2P File Sharing with WebRTC</h1>
            <div className=" m-10 p-5 border-4 border-amber-50">
                <br></br>
                <button onClick={handleStartCall}>Start Call
                </button>
                <br></br>
                <button onClick={(e) => {
                    console.log("SDP")
                    console.log(JSON.stringify(pc.current?.localDescription))
                    console.log(callId)
                }}>Print Offer
                </button>
                <br></br>
                <button onClick={async (e) => {
                    const callData = await fetch('/api/get-call', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ callId })
                    }).then(res => res.json());
                    console.log("Call Data: ", callData);
                }}>Print Offer
                </button>
                <br></br>
            </div>
        </div>
    );
}

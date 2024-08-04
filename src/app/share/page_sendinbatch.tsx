// app/pageD.tsx
"use client"

import { useEffect, useRef, useState } from "react";

export default function ShareBox() {
    const [callId, setCallId] = useState("");
    const pc = useRef<RTCPeerConnection | null>(null);
    const data_channel = useRef<RTCDataChannel | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
    const [iceCandidates, setIceCandidates] = useState<RTCIceCandidate[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            pc.current = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                iceCandidatePoolSize: 10
            });
            pc.current.ondatachannel = (e) => {
                e.channel.onopen = () => {
                    console.log("Listening to peer");
                }
                e.channel.onmessage = (e) => {
                    console.log("Message from peer: " + e.data);
                }
            }
            data_channel.current = pc.current.createDataChannel("DATA");
            data_channel.current.onopen = () => {
                console.log("Connection opened");
            }
            data_channel.current.onmessage = (e) => {
                console.log("Received message: ", e.data);
            }
            pc.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
                console.log("event.icecandidate", event.candidate);
                if (event.candidate) {
                    setIceCandidates(prev => [...prev, event.candidate]);
                }
            }
        }
    }, []);

    useEffect(() => {
        const sendIceCandidates = async () => {
            if (iceCandidates.length > 0 && callId) {
                while (pc.current.iceGatheringState !== 'complete') {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                const candidatePromises = iceCandidates.map(candidate =>
                    fetch('/api/add-ice-candidate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            callId,
                            candidate: candidate.toJSON(),
                            type: 'offer'
                        })
                    })
                );

                await Promise.all(candidatePromises);
                console.log("ICE candidates sent");
            }
        };
        sendIceCandidates();
    }, [iceCandidates, callId]);

    async function handleStartCall() {
        if (pc.current) {
            const offerDescription = await pc.current.createOffer();
            const response = await fetch('/api/create-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offer: offerDescription })
            });
            const data = await response.json();
            console.log(data);
            setCallId(data.callId)
            await pc.current.setLocalDescription(offerDescription);

            const interval = setInterval(async () => {
                const callData = await fetch('/api/get-call', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callId: data.callId })
                }).then(res => res.json());
                console.log("Call Data: ", callData);
                if (callData.answer && !pc.current?.currentRemoteDescription) {
                    console.log("Setting answer description: ", callData.answer);
                    const answerDescription = new RTCSessionDescription(callData.answer);
                    await pc.current.setRemoteDescription(answerDescription);
                    clearInterval(interval);

                    for (const candidate of callData.answerCandidates) {
                        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                }
            }, 1000);
        }
    }

    useEffect(() => {
        const listen_new_candiates = setInterval(async () => {
            const callData = await fetch('/api/get-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callId })
            }).then(res => res.json());
            console.log("Call Data: ", callData);
            for (const candidate of callData.answerCandidates) {
                await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
            }
        }, 20000)
        return () => clearInterval(listen_new_candiates);
    }, [callId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result;
                if (result) {
                    setFileData(result as ArrayBuffer);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    const handleFileSend = () => {
        if (data_channel.current && fileData) {
            //data_channel.current.send(fileData.slice(0,20))
            data_channel.current.send("Imagine the file");
            data_channel.current.send(fileData.slice(0,20));
            console.log(fileData.slice(0,20));
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            <div className="bg-white p-10 rounded-lg shadow-lg text-center">
                <h1 className="text-2xl font-bold mb-5">P2P File Sharing with WebRTC</h1>
                <div className="space-y-4">
                    <button onClick={handleStartCall}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Start Call
                    </button>
                    <br></br>
                    <button onClick={() => {
                        console.log("SDP")
                        console.log(JSON.stringify(pc.current?.localDescription))
                        console.log(callId)
                    }} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                        Print Offer
                    </button>
                    <br></br>
                    <button onClick={async () => {
                        const callData = await fetch('/api/get-call', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ callId })
                        }).then(res => res.json());
                        console.log("Call Data: ", callData);
                    }} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                        Print Call Data
                    </button>
                    <br></br>
                    <button onClick={() => {
                        data_channel.current?.send("SHABALABAdingdong");
                    }} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                        Ping
                    </button>
                    <br></br>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded cursor-pointer"
                    />
                    <br></br>
                    <button onClick={handleFileSend}
                            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                        Send File
                    </button>
                    <br></br>
                    {callId}
                </div>
            </div>
        </div>
    );
}

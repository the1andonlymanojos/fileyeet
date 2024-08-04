// app/page_everythingworksexceptfile.tsx
"use client"

import { useEffect, useRef, useState } from "react";

export default function ShareBox() {

    //let callId: string;
    const [callId, setCallId] = useState("");
    const pc = useRef<RTCPeerConnection | null>(null);
    const data_channel = useRef<RTCDataChannel | null>(null);
    const feedback_channel = useRef<RTCDataChannel | null>(null);
    let listen_for_ice_candidates = useRef(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileData, setFileData] = useState<ArrayBuffer | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            pc.current = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                iceCandidatePoolSize: 10
            });
            data_channel.current = pc.current.createDataChannel("main");
            data_channel.current.onopen = (e) => {
                console.log("Connection opened")
            }
            data_channel.current.onmessage = (e) => {
                console.log("Received message: ", e.data);
            }
            feedback_channel.current = pc.current.createDataChannel("feedback");
            data_channel.current.onopen = (e) => {
                console.log("Connection opened")
            }
            data_channel.current.onmessage = (e) => {
                console.log("Received message: ", e.data);
            }
        }
    }, []);  //Initialising

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

    useEffect(() => {
        if (pc.current){
            pc.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
                handleNewICECandidate(event); // console.log("New Ice Candidate: ", event.candidate?.toJSON());
            };
        }

    }, [callId, pc.current]); //updating callback


    async function handleStartCall() {
        if (pc.current) {
            const offerDescription = await pc.current?.createOffer();
            const response = await fetch('/api/create-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offer: offerDescription })
            });
            const data = await response.json();
            console.log(data);
            setCallId(data.callId)
            await pc.current?.setLocalDescription(offerDescription);

            const interval = setInterval(async () => {
                const callData = await fetch('/api/get-call', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callId: data.callId })
                }).then(res => res.json());
                console.log("Call Data: ", callData);
                // @ts-ignore
                if (callData.answer && !pc.current.currentRemoteDescription) {
                    console.log("Setting answer description: ", callData.answer);
                    const answerDescription = new RTCSessionDescription(callData.answer);
                    await pc.current?.setRemoteDescription(answerDescription);


                    for (const candidate of callData.answerCandidates) {
                        await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                    listen_for_ice_candidates.current = true
                    clearInterval(interval);
                }


            }, 1000);
        }
    }

    // useEffect(() => {
    //     console.log("listen_for_ice_candidates", listen_for_ice_candidates.current);
    //     const cb = async () => {
    //         const callData = await fetch('/api/get-call', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ callId: callId })
    //         }).then(res => res.json());
    //         console.log("Call Data: ", callData);
    //         for (const candidate of callData.answerCandidates) {
    //             await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
    //         }
    //     }
    //     let listen_new_candiates = setInterval( cb, 2000)
    //     if (!listen_for_ice_candidates.current){
    //         clearInterval(listen_new_candiates);
    //     } else {
    //         listen_new_candiates =  setInterval(cb, 2000)
    //     }
    // }, [listen_for_ice_candidates.current]);


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
        if (data_channel.current && fileData && file) {
            if (data_channel.current.readyState === 'open') {
                // Prepare file details
                const fileDetails = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified
                };

                // Send file details as JSON
                data_channel.current.send(JSON.stringify({
                    type: 'fileDetails',
                    details: fileDetails
                }));

                // Send file data in chunks
                const CHUNK_SIZE = 16384; // 16KB chunks
                let offset = 0;

                const sendNextChunk = () => {
                    if (offset < fileData.byteLength) {
                        const chunk = fileData.slice(offset, offset + CHUNK_SIZE);
                        data_channel.current.send(chunk);
                        offset += CHUNK_SIZE;
                        setTimeout(sendNextChunk, 10); // Slight delay to prevent overloading the channel
                    } else {
                        data_channel.current.send(JSON.stringify({
                            type: 'fileTransferComplete',
                            message: 'File transfer completed'
                        }));
                    }
                };

                sendNextChunk();
            } else {
                console.error('Data channel is not open');
            }
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
                    <button onClick={(e) => {
                        console.log("SDP")
                        console.log(JSON.stringify(pc.current?.localDescription))
                        console.log(callId)
                    }} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                        Print Offer
                    </button>
                    <br></br>
                    <button onClick={async (e) => {
                        const callData = await fetch('/api/get-call', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({callId})
                        }).then(res => res.json());
                        console.log("Call Data: ", callData);
                    }} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                        Print Call Data
                    </button>
                    <br></br>
                    <button onClick={async (e) => {
                        data_channel.current?.send("SHABALABAdingdong")
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

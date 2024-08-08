// app/AnswerComponent.tsx
"use client"

import {useEffect, useRef, useState} from "react";

export default function AnswerComponent() {

    const [callId, setCallId] = useState("");
    const rc = useRef<RTCPeerConnection | null>(null);
    const recieve_channel = useRef<RTCDataChannel | null>(null);
    const feedback_channel = useRef<RTCDataChannel | null>(null);
    const new_Channel = useRef<RTCDataChannel | null>(null);
    const [debugLine,setDebugLine] = useState<string>("");
    const [debugLine2,setDebugLine2] = useState<string>("");
    let counter =0;
    let fileDetails: { size: number; name: string; } | null = null;
    let receivedChunks: BlobPart[] | undefined = [];
    let totalSize = 0;
    useEffect(() => {
        if (typeof window !== 'undefined') {
            rc.current = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                iceCandidatePoolSize: 10
            });
            // rc.current.ondatachannel = (e) => {
            //     e.channel.onopen = (e) => {
            //         console.log("Connection opened, listening to the other dude")
            //     }
            //     e.channel.onmessage = (e) => {
            //         console.log("Message from peer: " + e.data)
            //     }
            //     recieve_channel.current = e.channel
            // }
            rc.current.ondatachannel = (e) => {
                if (e.channel.label == 'main')
                {

                    const receiveChannel = e.channel;


                    receiveChannel.onopen = () => {
                        console.log("Connection opened, listening to the other peer");
                    };

                    receiveChannel.onmessage = (e) => {
                        const message = e.data;
                        console.log(e.data);
                        console.log("type of message ", typeof(message))
                        if (typeof message === 'string') {
                            const parsedMessage = JSON.parse(message);
                            if (parsedMessage.type === 'fileDetails') {
                                fileDetails = parsedMessage.details;
                                // @ts-ignore
                                totalSize = fileDetails.size;
                                receivedChunks = [];
                                console.log("Received file details: ", fileDetails);
                                setDebugLine2("Received file details: "+fileDetails)

                            } else if (parsedMessage.type === 'fileTransferComplete') {
                                console.log(parsedMessage.message);
                                // @ts-ignore
                                if (receivedChunks.length > 0) {
                                    const blob = new Blob(receivedChunks);
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    // @ts-ignore
                                    a.download = fileDetails.name;
                                    document.body.appendChild(a);
                                    a.click();
                                    setTimeout(() => {
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                    }, 0);
                                    console.log("File downloaded");
                                }
                            }
                        } else if (message instanceof ArrayBuffer || message instanceof Blob) {
                            // @ts-ignore
                            if (message instanceof Blob) {
                                // Convert Blob to ArrayBuffer
                                const reader = new FileReader();
                                reader.onload = function(event) {
                                    // @ts-ignore
                                    const arrayBuffer = new Uint8Array(event.target.result);
                                    // @ts-ignore
                                    receivedChunks.push(arrayBuffer);
                                    setDebugLine("Received chunk " + counter);
                                    counter = counter +1;
                                    console.log("Received chunk: ", arrayBuffer.byteLength);
                                };
                                reader.readAsArrayBuffer(message);
                            } else {
                                // @ts-ignore
                                receivedChunks.push(new Uint8Array(message));
                                setDebugLine("Received chunk " + counter);
                                counter = counter + 1;
                                if ("byteLength" in message) {
                                    console.log("Received chunk: ", message.byteLength);
                                }
                            }
                        }
                    };

                    receiveChannel.onerror = (error) => {
                        console.error("Receive channel error: ", error);
                    };

                    receiveChannel.onclose = () => {
                        console.log("Receive channel closed");
                    };

                    recieve_channel.current = receiveChannel;
                }
                else if (e.channel.label == 'feedback') {
                    const feedbackChannel = e.channel;

                    feedbackChannel.onopen = () => {
                        console.log("Feedback channel opened");
                    };

                    feedbackChannel.onmessage = (e) => {
                        console.log("Feedback from sender: ", e.data);
                        console.log(e.data)
                    };

                    feedbackChannel.onerror = (error) => {
                        console.error("Feedback channel error: ", error);
                    };

                    feedbackChannel.onclose = () => {
                        console.log("Feedback channel closed");
                    };

                    feedback_channel.current = feedbackChannel;
                }
                else if(e.channel.label == 'DATA'){
                new_Channel.current = e.channel;
                new_Channel.current.binaryType = "arraybuffer";
                new_Channel.current.onmessage = onReceiveMessageCallback;
                }

            }
        }
    }, []);
    let receiveBuffer  =[];
    let receivedSize = 0;
    function onReceiveMessageCallback(e) {
        const message = e.data;
        console.log(e.data);
        console.log("type of message ", typeof(message))

        if (typeof message === 'string'){
            const parsedMessage = JSON.parse(message);
            fileDetails = parsedMessage.details;
            // @ts-ignore
            totalSize = fileDetails.size;
            receivedChunks = [];
            console.log("Received file details: ", fileDetails);
            setDebugLine2("Received file details: "+fileDetails)
        } else {
            console.log(`Received Message ${e.data.byteLength}`);
            receiveBuffer.push(e.data);
            receivedSize += e.data.byteLength;


        // we are assuming that our signaling protocol told
        // about the expected file size (and name, hash, etc).
        const file = fileDetails
        if (receivedSize === file.size) {
            const received = new Blob(receiveBuffer);
            receiveBuffer = [];
            const url = URL.createObjectURL(received);
            const a = document.createElement('a');
            a.href = url;
            // @ts-ignore
            a.download = fileDetails.name;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
            console.log("File downloaded");

        }
        }
    }


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
                    type: 'answer'
                })
            });
        }
    };


    useEffect(() => {
        if (rc.current){
            rc.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
                console.log("Added ice candidate", event.candidate);
                handleNewICECandidate(event); // console.log("New Ice Candidate: ", event.candidate?.toJSON());
            };
        }
    }, [callId, rc.current]);


    const handleSubmitAnswer = async () => {
        const callData = await fetch('/api/get-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callId })
        }).then(res => res.json());
        const offerDescription = callData.offer;
        console.log(callData);
        if (rc.current) {
            await rc.current.setRemoteDescription(new RTCSessionDescription(offerDescription));
            const iceCandidates = callData.offerCandidates;
            for (const candidate of iceCandidates) {
                try {
                    await rc.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
                catch (e) {
                    console.error(e);
                }

            }
            console.log("Added ice candidate");
            const answerDescription = await rc.current.createAnswer();
            await fetch('/api/answer-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callId,
                    answer: answerDescription
                })
            });
            await rc.current.setLocalDescription(answerDescription);

            const interval = setInterval(async () => {
                const callData = await fetch('/api/get-call', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callId })
                }).then(res => res.json());

                for (const candidate of callData.answerCandidates) {
                    // @ts-ignore
                    await rc.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            }, 20000);
        } else {
            console.log("Error occurred.");
        }
    };

    const handleGetAnswer = async () => {
        // Logic to retrieve answer
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            <div className="bg-white p-10 rounded-lg shadow-lg text-center">
                <h1 className="text-2xl font-bold mb-5">Answer Submission</h1>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={callId}
                        onChange={(e) => setCallId(e.target.value)}
                        placeholder="Enter Call ID"
                        className="px-4 py-2 border rounded w-full"
                    />
                    <button onClick={handleSubmitAnswer} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Connect
                    </button>
                    <br></br>
                    <button onClick={handleGetAnswer} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                        Get Answer
                    </button>
                    <br></br>
                    <div className="px-4 py-2 bg-gray-200 rounded">
                        {debugLine}
                    </div>
                </div>
            </div>
        </div>
    );
}

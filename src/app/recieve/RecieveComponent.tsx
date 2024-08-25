// app/AnswerComponent.tsx
"use client"
import {useEffect, useRef, useState} from "react";


export default function AnswerComponent() {

    const [callId, setCallId] = useState("");
    const rc = useRef<RTCPeerConnection | null>(null);
    const recieve_channel = useRef<RTCDataChannel | null>(null);
    const feedback_channel = useRef<RTCDataChannel | null>(null);
 //  const [debugInfo, setDebugInfo] = useState<string[]>([]); // Array for terminal style screen
    const [progress, setProgress] = useState(0); // Progress percentage
    const [avgSpeed, setAvgSpeed] = useState(0); // Average speed in MBps
    const [show_terminal, setShow_terminal] = useState(false)
    const connectButtonRef = useRef(null);
    //local storage:

    let initialTime = 0;
    let latesttime = 0;
    const chunkSize = 16384 - 16; // Adjusted chunk size, considering metadata
    let threshold = 100;

    const [debugInfo, setDebugInfo] = useState<string[]>([]); // Array for terminal style screen
    const addLog = (message: string) => setDebugInfo((prevLogs: string[]) => [...prevLogs, message]);
    const handleConnect = () => {
        // Logic for connecting
        setDebugInfo([...debugInfo, `Connected with ID: ${callId}`]);
        handleSubmitAnswer();
    };
    useEffect(() => {
        if (typeof window !== 'undefined') {
            rc.current = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ],
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
                    receiveChannel.binaryType = "arraybuffer";
                    let fileDetails: { size: number; name: string; } | null = null;
                    let receivedChunks: ArrayBuffer[] = [];

                    receiveChannel.onopen = () => {
                        console.log("Connection opened, listening to the other peer");
                        setDebugInfo([...debugInfo, "Connected to sender"]);
                    };

                    receiveChannel.onmessage = (e) => {
                        const message = e.data;
                        //console.log(e.data);
                       // console.log("type of message ", typeof(message))
                        if (typeof message === 'string') {
                            const parsedMessage = JSON.parse(message);
                            if (parsedMessage.type === 'fileDetails') {
                                fileDetails = parsedMessage.details;
                                // @ts-ignore
                                //totalSize = fileDetails.size;
                                // @ts-ignore

                                receivedChunks = [];
                                addLog("Received file details: " + fileDetails?.name);
                                setProgress(0); // Reset progress at the start of file transfer

                            } else if (parsedMessage.type === 'fileTransferComplete') {
                               // console.log(parsedMessage.message);
                                // @ts-ignore
                                //console.log(receivedChunks.length)
                                // @ts-ignore
                                if (receivedChunks.length > 0) {
                                    console.log("HERE MAN, FILE DONE")
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
                                    addLog("File downloaded successfully.");
                                    setProgress(100); // Mark progress as complete
                                    addLog("AVG speed"+ (receivedChunks.length*16352/1000000)/((latesttime-initialTime)/ 1000))
                                    console.log("File downloaded");
                                    console.log("AVG speed", (receivedChunks.length*16352/1000000)/((latesttime-initialTime)/ 1000));
                                    rc.current?.close();
                                }
                            }
                        } else if (message instanceof ArrayBuffer) {

                            latesttime = Date.now();
                            // @ts-ignore
                            const metadataSize = 4 + 8 + 4; // Total metadata size (identifier + timestamp + sequence number)
                            const dataBuffer = message.slice(metadataSize);
                            receivedChunks.push(dataBuffer);
                                // @ts-ignore
                            const view = new DataView(message);

                            // Read metadata
                            const identifier = view.getUint32(0);               // Identifier (4 bytes)
                            const timestamp = Number(view.getBigUint64(4));    // Timestamp (8 bytes)
                            const sequenceNumber = view.getUint32(12);         // Sequence number (4 bytes)
                            if (sequenceNumber == 0) {
                                initialTime = Date.now();
                            }
                            if (sequenceNumber%threshold==0){
                                feedback_channel.current?.send(JSON.stringify({type: 'feedback', message: 'received', sequenceNumber: sequenceNumber}));
                            }
                            // @ts-ignore
                            if (sequenceNumber%100==0 || sequenceNumber >= fileDetails?.size/(16384-16)-1 ){

                            // console.log("speed: ", (dataBuffer.byteLength/1024)/((latesttime-timestamp)/ 1000))
                            // console.log("Received metadata:", { identifier, timestamp, sequenceNumber });
                            // console.log("Received chunk size:", dataBuffer.byteLength);
                                console.log(sequenceNumber)
                                if (fileDetails) {
                                    const totalSize = fileDetails.size;
                                    const receivedSize = sequenceNumber * chunkSize;
                                    const progressPercentage = (receivedSize / totalSize) * 100;
                                    setProgress(progressPercentage);

                                    const elapsedTime = (latesttime - initialTime) / 1000; // in seconds
                                    const averageSpeed = (receivedSize / 1000000) / elapsedTime; // in MBps
                                    setAvgSpeed(averageSpeed);
                                }

                            }
                            // Handle dataBuffer, e.g., store or concatenate


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

                if(rc.current?.iceConnectionState === 'connected'){
                    const callData = await fetch('/api/get-call', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({callId})
                    }).then(res => res.json());

                    for (const candidate of callData.answerCandidates) {
                        // @ts-ignore
                        await rc.current.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                }

            }, 20000);
        } else {
            console.log("Error occurred.");
        }
    };

    const handleGetAnswer = async () => {
        // Logic to retrieve answer
    };

    const [show_scanner, setShowScanner] = useState(true);
    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                <h1 className="text-2xl font-bold mb-5 text-gray-800 dark:text-white">Connect to Share</h1>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={callId}
                        onChange={(e) => setCallId(e.target.value)}
                        placeholder="Enter Share Code"
                        className="px-4 py-2 border rounded w-full bg-gray-200 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                        onClick={() => {
                            handleConnect();
                        }}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-300"
                        ref={connectButtonRef}
                    >
                        Connect and Download
                    </button>


                    <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                            className="bg-blue-500 text-xs font-medium text-blue-200 text-center p-0.5 leading-none rounded-full"
                            style={{width: `${progress}%`}}
                        >
                            {progress.toFixed(2)}%
                        </div>
                    </div>
                    <div className="mt-6">
                        <button
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
                            onClick={()=>{
                                setShow_terminal(!show_terminal);
                            }}
                        >
                            {show_terminal ? 'Hide Terminal' : 'Show Terminal'}
                        </button>
                        {show_terminal && (
                            <div className="mt-2 bg-black text-green-400 p-4 rounded-lg h-32 overflow-y-auto font-mono">
                                {debugInfo.length === 0 ? (
                                    <p>No logs yet...</p>
                                ) : (
                                    debugInfo.map((log, index) => (
                                        <p key={index}>{log}</p>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

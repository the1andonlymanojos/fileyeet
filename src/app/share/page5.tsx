// app/page_everythingworksexceptfile.tsx
"use client"

import { useEffect, useRef, useState } from "react";
import QRCode from 'qrcode.react';
import WebRTCConnection from "@/lib/webrtc";

export default function ShareBox() {

    //let callId: string;
    const [callId, setCallId] = useState('');
    const webRTC_obj = useRef<WebRTCConnection | null>(null);
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const [terminalVisible, setTerminalVisible] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);




    const handleFileClick = () => {
        if (fileInputRef.current) {
            // @ts-ignore
            fileInputRef.current.click();
        }
    };

    const handleFileDrop = (event: { preventDefault: () => void; dataTransfer: { files: any; }; }) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileChange({ target: { files } });
        }
    };

    const handleFileChange = (event: { target: any; }) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
            event.target.value = null;
        }
    };

    const handleCancel = () => {
        setSelectedFile(null);
    };
    useEffect(() => {
        if (typeof window !== 'undefined') {
            webRTC_obj.current = new WebRTCConnection();
        }
    }, []);  //Initialising

    const handleNewICECandidate = async (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
            console.log("Event.Candidate", event.candidate);
            console.log("CallId", callId)
            addLog("Sending new ICE candidate")
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

    // useEffect(() => {
    //     if (pc.current){
    //         pc.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
    //             handleNewICECandidate(event); // console.log("New Ice Candidate: ", event.candidate?.toJSON());
    //         };
    //     }
    //
    // }, [callId, pc.current]); //updating callback


    // async function handleStartCall() {
    //     if (pc.current) {
    //         const offerDescription = await pc.current?.createOffer();
    //         const response = await fetch('/api/create-offer', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ offer: offerDescription })
    //         });
    //         const data = await response.json();
    //         console.log(data);
    //         setCallId(data.callId)
    //         await pc.current?.setLocalDescription(offerDescription);
    //         addLog("Setting new local description!")
    //         initListen.current = true;
    //         return data.callId;
    //     }
    // }
    // const initListen = useRef(false);

    // useEffect(() => {
    //     console.log("RUNNING EFECT")
    //     if (initListen.current) {
    //         const interval = setInterval(async () => {
    //             const callData = await fetch('/api/get-call', {
    //                 method: 'POST',
    //                 headers: {'Content-Type': 'application/json'},
    //                 body: JSON.stringify({callId: callId})
    //             }).then(res => res.json());
    //             console.log("Call Data: ", callData);
    //
    //             // @ts-ignore
    //             if (callData.answer && !pc.current.currentRemoteDescription) {
    //
    //                 console.log("Setting answer description: ", callData.answer);
    //                 addLog("Setting answer description:")
    //                 const answerDescription = new RTCSessionDescription(callData.answer);
    //                 await pc.current?.setRemoteDescription(answerDescription);
    //                 clearInterval(interval);
    //
    //                 for (const candidate of callData.answerCandidates) {
    //                     await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
    //                 }
    //                 // console.log("State", pc.current?.connectionState)
    //                 // if (pc.current?.connectionState == 'new'){
    //                 //     handleFileSend();
    //                 // }
    //                 pc.current?.addEventListener('connectionstatechange', () => {
    //                     console.log("Connection state: ", pc.current?.connectionState);
    //                     if (pc.current?.connectionState === 'connected') {
    //                         console.log("Connection opened, starting file send...");
    //                         addLog("Connection opened, starting file send...")
    //                         data_channel.current?.addEventListener('open', handleFileSend);
    //                     }
    //                 });
    //
    //                 listen_for_ice_candidates.current = true
    //
    //             } else {
    //                 addLog("Waiting for response")
    //             }
    //
    //
    //         }, 1000);
    //     }
    // }, [initListen.current]);



    // const handleFileSend = () => {
    //     console.log("Sending file");
    //     if (data_channel.current && selectedFile) {
    //         if (data_channel.current.readyState === 'open') {
    //             // Prepare file details
    //             const fileDetails = {
    //                 name: selectedFile.name,
    //                 type: selectedFile.type,
    //                 size: selectedFile.size,
    //                 lastModified: selectedFile.lastModified
    //             };
    //
    //             // Send file details as JSON
    //             data_channel.current.send(JSON.stringify({
    //                 type: 'fileDetails',
    //                 details: fileDetails
    //             }));
    //
    //             const chunkSize = 16384-16;
    //             const fileReader = new FileReader();
    //             let offset = 0;
    //             let sequenceNumber = 0;
    //             fileReader.addEventListener('error', error => console.error('Error reading file:', error));
    //             fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
    //             fileReader.addEventListener('load', e => {
    //                 //console.log('FileRead.onload ', e);
    //                 // @ts-ignore
    //                 const arrayBuffer = e.target.result as ArrayBuffer;
    //                 const identifier = 1234; // Replace with your actual identifier
    //                 const timestamp = Date.now();
    //
    //                 const metadataSize = 4 + 8 + 4; // identifier (4 bytes) + timestamp (8 bytes) + sequenceNumber (4 bytes)
    //                 const totalSize = metadataSize + arrayBuffer.byteLength;
    //
    //                 const newArrayBuffer = new ArrayBuffer(totalSize);
    //                 const view = new DataView(newArrayBuffer);
    //
    //                 view.setUint32(0, identifier);                       // Identifier (4 bytes)
    //                 view.setBigUint64(4, BigInt(timestamp));             // Timestamp (8 bytes)
    //                 view.setUint32(12, sequenceNumber++);
    //
    //                 const originalData = new Uint8Array(arrayBuffer);
    //                 const newData = new Uint8Array(newArrayBuffer, metadataSize);
    //                 newData.set(originalData);
    //
    //                 data_channel.current?.send(newArrayBuffer);
    //                 offset += arrayBuffer.byteLength;
    //                 if (offset < selectedFile.size) {
    //                     readSlice(offset);
    //                 } else {
    //                     // @ts-ignore
    //                     data_channel.current.send(JSON.stringify({
    //                         type: 'fileTransferComplete',
    //                         message: 'File transfer completed'
    //                     }));
    //                 }
    //             });
    //             const readSlice = (o: number) => {
    //                 // console.log('readSlice ', o);
    //                 const slice = selectedFile.slice(offset, o + chunkSize);
    //                 fileReader.readAsArrayBuffer(slice);
    //             };
    //             readSlice(0);
    //         } else {
    //             console.error('Data channel is not open');
    //         }
    //     }
    // };

    const toggleTerminal = () => setTerminalVisible(!terminalVisible);
    const addLog = (message: string) => setLogs((prevLogs: string[]) => [...prevLogs, message]);
    // @ts-ignore
    // @ts-ignore
    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 m-6 p-6 rounded-lg shadow-lg  text-center">
                {!sending &&
                    <div
                        className="border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg p-10 relative overflow-hidden
                    bg-white dark:bg-gray-800 hover:bg-gray-100 hover:dark:bg-gray-600 ease-in-out transition-colors duration-500
                    before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:to-gray-100
                    before:dark:to-gray-600 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 aspect-square max-w-72 flex flex-col justify-center flex items-center"
                        onClick={!selectedFile ? handleFileClick : undefined}
                        onDrop={handleFileDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        {!selectedFile ? (
                            <div className="flex flex-col items-center justify-center space-y-2 relative z-10">
                                <div className="text-orange-500 text-4xl">+</div>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Click to browse or drag files here to start sharing
                                </p>
                            </div>
                        ) : (
                            <div
                                className="flex flex-col md:min-w-72 items-center justify-center space-y-2 relative z-10">
                                <p className="text-gray-600  dark:text-gray-300">
                                    {selectedFile.name} <br></br>({(selectedFile.size / 1024).toFixed(2)} KB)
                                </p>
                                <button
                                    className="mt-4 px-4 py-2 top-0   bg-red-500 text-white rounded hover:bg-red-600"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            ref={fileInputRef}
                        />
                    </div>
                } {
                sending && selectedFile && selectedFile.name !== '' && (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg p-10 relative overflow-hidden
                bg-white dark:bg-gray-800 hover:bg-gray-100 hover:dark:bg-gray-600 ease-in-out transition-colors duration-500
                aspect-square max-w-72 flex flex-col items-center justify-center space-y-4 text-center">
                        <div
                            className="text-gray-600 dark:text-gray-300 flex-col flex items-center justify-center space-y-2 relative z-10">
                            <p className="font-bold">Share this code with the receiver in any way you prefer:</p>
                            <QRCode value={callId} size={128}/>
                            <p className="text-xl font-mono">{callId}</p>
                        </div>
                    </div>
                )
            }


                {selectedFile && !sending &&
                    (
                        <button className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                onClick={async () => {
                                    const id = await webRTC_obj.current?.createOffer();
                                    console.log("DONE")
                                    console.log(callId);
                                    if (id !== '') {
                                        setSending(true);
                                    }

                                }}>
                            Send
                        </button>
                    )}
                <div className="mt-6">
                    <button
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
                        onClick={toggleTerminal}
                    >
                        {terminalVisible ? 'Hide Terminal' : 'Show Terminal'}
                    </button>
                    {terminalVisible && (
                        <div className="mt-2 bg-black text-green-400 p-4 rounded-lg h-32 overflow-y-auto font-mono">
                            {logs.length === 0 ? (
                                <p>No logs yet...</p>
                            ) : (
                                logs.map((log, index) => (
                                    <p key={index}>{log}</p>
                                ))
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>


    );
}

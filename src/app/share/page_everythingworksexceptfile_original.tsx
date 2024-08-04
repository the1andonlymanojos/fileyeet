// // app/page_everythingworksexceptfile.tsx
// "use client"
//
// import { useEffect, useRef, useState } from "react";
//
// export default function ShareBox() {
//
//     //let callId: string;
//     const [callId, setCallId] = useState("");
//     const pc = useRef<RTCPeerConnection | null>(null);
//     const data_channel = useRef<RTCDataChannel | null>(null);
//     const listen_for_ice_candidates = false;
//     useEffect(() => {
//         if (typeof window !== 'undefined') {
//             pc.current = new RTCPeerConnection({
//                 iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//                 iceCandidatePoolSize: 10
//             });
//             pc.current.ondatachannel = (e) => {
//                 e.channel.onopen = (e) => {
//                     console.log("Listening to peer")
//                 }
//                 e.channel.onmessage = (e) => {
//                     console.log("Message from peer: " + e.data)
//                 }
//             }
//             data_channel.current = pc.current.createDataChannel("DATA");
//             data_channel.current.onopen = (e) => {
//                 console.log("Connection opened")
//             }
//             data_channel.current.onmessage = (e) => {
//                 console.log("Received message: ", e.data);
//             }
//         }
//     }, []);
//
//     const handleNewICECandidate = async (event: RTCPeerConnectionIceEvent) => {
//         if (event.candidate) {
//             console.log("Event.Candidate", event.candidate);
//             console.log("CallId", callId)
//             await fetch('/api/add-ice-candidate', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     callId,
//                     candidate: event.candidate.toJSON(),
//                     type: 'offer'
//                 })
//             });
//         }
//     };
//     useEffect(() => {
//         if (pc.current){
//             pc.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
//                 handleNewICECandidate(event); // console.log("New Ice Candidate: ", event.candidate?.toJSON());
//             };
//         }
//
//     }, [callId, pc.current]);
//
//
//     async function handleStartCall() {
//         if (pc.current) {
//             const offerDescription = await pc.current?.createOffer();
//             const response = await fetch('/api/create-offer', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ offer: offerDescription })
//             });
//             const data = await response.json();
//             console.log(data);
//             setCallId(data.callId)
//             await pc.current?.setLocalDescription(offerDescription);
//
//             const interval = setInterval(async () => {
//                 const callData = await fetch('/api/get-call', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ callId: data.callId })
//                 }).then(res => res.json());
//                 console.log("Call Data: ", callData);
//                 if (callData.answer && !pc.current.currentRemoteDescription) {
//                     console.log("Setting answer description: ", callData.answer);
//                     const answerDescription = new RTCSessionDescription(callData.answer);
//                     await pc.current.setRemoteDescription(answerDescription);
//                     clearInterval(interval);
//
//                     for (const candidate of callData.answerCandidates) {
//                         await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
//                     }
//                 }
//
//
//             }, 1000);
//         }
//     }
//
//     useEffect(() => {
//         const listen_new_candiates = setInterval(async () => {
//             const callData = await fetch('/api/get-call', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ callId: data.callId })
//             }).then(res => res.json());
//             console.log("Call Data: ", callData);
//             for (const candidate of callData.answerCandidates) {
//                 await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
//             }
//         }, 20000)
//         if (!listen_for_ice_candidates){
//             clearInterval(listen_new_candiates);
//         }
//     }, [listen_for_ice_candidates]);
//
//
//
//
//     return (
//         <div className="flex h-screen items-center justify-center bg-gray-100">
//             <div className="bg-white p-10 rounded-lg shadow-lg text-center">
//                 <h1 className="text-2xl font-bold mb-5">P2P File Sharing with WebRTC</h1>
//                 <div className="space-y-4">
//                     <button onClick={handleStartCall}
//                             className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
//                         Start Call
//                     </button>
//                     <br></br>
//                     <button onClick={(e) => {
//                         console.log("SDP")
//                         console.log(JSON.stringify(pc.current?.localDescription))
//                         console.log(callId)
//                     }} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
//                         Print Offer
//                     </button>
//                     <br></br>
//                     <button onClick={async (e) => {
//                         const callData = await fetch('/api/get-call', {
//                             method: 'POST',
//                             headers: {'Content-Type': 'application/json'},
//                             body: JSON.stringify({callId})
//                         }).then(res => res.json());
//                         console.log("Call Data: ", callData);
//                     }} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
//                         Print Call Data
//                     </button>
//                     <br></br>
//                     <button onClick={async (e) => {
//                         data_channel.current?.send("SHABALABAdingdong")
//                     }} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
//                         Ping
//                     </button>
//                     <br></br>
//                     {callId}
//                 </div>
//             </div>
//         </div>
//     );
// }

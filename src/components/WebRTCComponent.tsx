// // components/WebRTCComponent.tsx
// "use client"
// import { useState, useRef, useEffect } from 'react';
//
// const WebRTCComponent: React.FC = () => {
//     const [callId, setCallId] = useState<string>('');
//     const [isCaller, setIsCaller] = useState<boolean>(false);
//     const ppc = useRef<RTCPeerConnection | null>(null);
//     const pc = ppc.current;
//     useEffect(() => {
//         // Ensure RTCPeerConnection is only accessed in the client-side environment
//         if (typeof window !== 'undefined') {
//             ppc.current = new RTCPeerConnection({
//                 iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//                 iceCandidatePoolSize: 10
//             });
//         }
//     }, []);
//
//
//     useEffect(() => {
//         const handleNewICECandidate = async (event: RTCPeerConnectionIceEvent) => {
//             if (event.candidate) {
//                 console.log("Event.Candidate", event.candidate);
//                 await fetch('/api/add-ice-candidate', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({
//                         callId,
//                         candidate: event.candidate.toJSON(),
//                         type: isCaller ? 'offer' : 'answer'
//                     })
//                 });
//             }
//         };
//
//         if (pc) {
//             pc.addEventListener('icecandidate', handleNewICECandidate);
//         }
//         return () => {
//             if (pc) pc.removeEventListener('icecandidate', handleNewICECandidate);
//
//         };
//     }, [callId, isCaller]);
//
//     const handleStartCall = async () => {
//         setIsCaller(true);
//         const offerDescription = await pc.createOffer();
//         // @ts-ignore
//         await pc.setLocalDescription(offerDescription);
//
//
//         console.log("Offer Description: ", offerDescription);
//         const response = await fetch('/api/create-offer', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ offer: offerDescription })
//         });
//
//         const data = await response.json();
//         setCallId(data.callId);
//
//         const interval = setInterval(async () => {
//             const callData = await fetch('/api/get-call', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ callId: data.callId })
//             }).then(res => res.json());
//             console.log("Call Data: ", callData);
//             if (callData.answer && !pc.currentRemoteDescription) {
//                 console.log("Setting answer description: ", callData.answer);
//                 const answerDescription = new RTCSessionDescription(callData.answer);
//                 await pc.setRemoteDescription(answerDescription);
//                 clearInterval(interval);
//
//                 for (const candidate of callData.answerCandidates) {
//                     await pc.addIceCandidate(new RTCIceCandidate(candidate));
//                 }
//             }
//
//
//         }, 1000);
//     };
//
//     const handleJoinCall = async () => {
//         setIsCaller(false);
//         const callData = await fetch('/api/get-call', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ callId })
//         }).then(res => res.json());
//
//         const offerDescription = callData.offer;
//         await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
//
//         const answerDescription = await pc.createAnswer();
//         await pc.setLocalDescription(answerDescription);
//         await fetch('/api/answer-offer', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 callId,
//                 answer: answerDescription
//             })
//         });
//
//         callData.offerCandidates.forEach(async (candidate: RTCIceCandidateInit) => {
//             await pc.addIceCandidate(new RTCIceCandidate(candidate));
//         });
//
//         const interval = setInterval(async () => {
//             const callData = await fetch('/api/get-call', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ callId })
//             }).then(res => res.json());
//
//             callData.answerCandidates.forEach(async (candidate: RTCIceCandidateInit) => {
//                 await pc.addIceCandidate(new RTCIceCandidate(candidate));
//             });
//         }, 1000);
//     };
//
//     return (
//         <div>
//             <button onClick={handleStartCall}>Start Call</button>
//             <button onClick={handleJoinCall}>Join Call</button>
//             <input
//                 type="text"
//                 value={callId}
//                 onChange={(e) => setCallId(e.target.value)}
//                 placeholder="Enter Call ID"
//             />
//         </div>
//     );
// };
//
// export default WebRTCComponent;

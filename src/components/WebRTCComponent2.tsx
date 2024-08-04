// // components/WebRTCComponent.tsx
// "use client"
// import { useState, useRef, useEffect } from 'react';
//
// const WebRTCComponent2: React.FC = () => {
//     const [callId, setCallId] = useState<string>('');
//     const [sdp, setSdp] = useState<string>('');
//     const [isCaller, setIsCaller] = useState<boolean>(false);
//     const pc = useRef<RTCPeerConnection | null>(null);
//     const data_channel = useRef<RTCDataChannel | null>(null);
//     const isSender = useRef<boolean>(false);
//     const textBoxRef = useRef(null);
//     const offerRef = useRef(null);
//     let id;
//     const [file, setFile] = useState<string>('');
//     const array_channels = useRef<RTCDataChannel[]>([]);
//     useEffect(() => {
//         // Ensure RTCPeerConnection is only accessed in the client-side environment
//         if (typeof window !== 'undefined') {
//             pc.current = new RTCPeerConnection({
//                 iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//                 iceCandidatePoolSize: 10
//             });
//
//
//             pc.current.ondatachannel = (e)=>{
//                 e.channel.onopen = (e)=>{
//                     console.log("Listenign to peer")
//                 }
//                 e.channel.onmessage = (e)=>{
//                     console.log("Message from peer: "+e.data)
//                 }
//                 array_channels.current.push(e.channel);
//             }
//
//             data_channel.current = pc.current.createDataChannel("DATA");
//             data_channel.current.onopen = (e) => {
//                 console.log("Connection opened" )
//             }
//             data_channel.current.onmessage = (e)=>{
//                 console.log("Received message: ", e.data);
//             }
//
//         }
//     }, []);
//
//     useEffect(() => {
//         console.log("callId updated:", callId);
//         id = callId;
//         console.log(id)
//     }, [callId]);
//     const handleNewICECandidate = async (event: RTCPeerConnectionIceEvent) => {
//         if (event.candidate) {
//             console.log("Event.Candidate", event.candidate);
//             console.log(id)
//             await fetch('/api/add-ice-candidate', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     callId:id,
//                     candidate: event.candidate.toJSON(),
//                     type: isCaller ? 'offer' : 'answer'
//                 })
//             });
//         }
//     };
//
//     const handleStartCall = async () => {
//         if (pc.current){
//             pc.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
//                 handleNewICECandidate(event);
//                // console.log("New Ice Candidate: ", event.candidate?.toJSON());
//             };
//             const offerDescription = await pc.current?.createOffer();
//
//             console.log("Offer Description: ", offerDescription);
//             const response = await fetch('/api/create-offer', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ offer: offerDescription })
//             });
//
//             await pc.current?.setLocalDescription(offerDescription);
//             const data = await response.json();
//             console.log(data);
//             setCallId(data.callId);
//             console.log("offerDescription", offerDescription);
//         }
//     }
//
//
//     async function handleJoinCall() {
//         console.log(textBoxRef.current)
//
//         const callData = await fetch('/api/get-call', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ callId })
//         }).then(res => res.json());
//         console.log("Call Data: ", callData);
//         const offerDescription = callData.offer;
//         await pc.current?.setRemoteDescription(new RTCSessionDescription(offerDescription));
//
//         const answerDescription = await pc.current?.createAnswer();
//         await pc.current?.setLocalDescription(answerDescription);
//
//
//         if (pc.current){
//             await pc.current.setRemoteDescription(JSON.parse(sdp));
//             const answer = await pc.current.createAnswer();
//             pc.current.setLocalDescription(answer);
//             console.log("answer", answer);
//         }
//     }
//     async function handleAnswer() {
//         console.log("Setting local descroption: "+JSON.parse(callId))
//         console.log(JSON.stringify(callId));
//         const jsonObj = JSON.parse(callId);
//         console.log(jsonObj)
//         await pc.current?.setRemoteDescription(jsonObj);
//     }
//
//     return (
//         <div className="flex flex-row items-center justify-center">
//             <div className=" m-10 p-5 border-4 border-amber-50">
//                 <br></br>
//                 <button onClick={handleStartCall}>Start Call
//                 </button>
//                 <br></br>
//                 <button onClick={handleAnswer}>accept ansewr
//                 </button>
//                 <br></br>
//                 <button onClick={(e) => {
//                     console.log("SDP")
//                     console.log(JSON.stringify(pc.current?.localDescription))
//                     console.log(callId)
//                 }}>Print Offer
//                 </button>
//                 <br></br>
//                 {/*<input*/}
//                 {/*    type="text"*/}
//                 {/*    value={callId}*/}
//                 {/*    onChange={(e) => setCallId(e.target.value)}*/}
//                 {/*    placeholder="Enter Answer:"*/}
//                 {/*/>*/}
//                 {callId}
//             </div>
//             <div className="m-10 p-5 border-4 border-amber-50">
//                 <br></br>
//                 <button onClick={handleJoinCall}>Join Call
//                 </button>
//                 <br></br>
//                 <button onClick={(e) => {
//                     console.log("SDP")
//                     console.log(callId)
//                     console.log(JSON.stringify(pc.current?.localDescription))
//                 }}>Print Offer
//                 </button>
//                 <br></br>
//                 {/*<input*/}
//                 {/*    type="text"*/}
//                 {/*    value={callId}*/}
//                 {/*    onChange={(e) => setCallId(e.target.value)}*/}
//                 {/*    ref={textBoxRef}*/}
//                 {/*    placeholder="Enter CallID"*/}
//                 {/*/>*/}
//                 {callId}
//                 <br></br>
//                 <input type="file" onChange={(e) => setFile(e.target.value)}/>
//                 <button onClick={(e) => {
//                     console.log("File name",file)
//                     const reader = new FileReader();
//
//                     data_channel.current?.send("PING")
//                 }}>send PING:
//                 </button>
//             </div>
//         </div>
//
//     );
// };
//
// export default WebRTCComponent2;

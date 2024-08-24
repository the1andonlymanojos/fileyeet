import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

function usePeerConnection(
    iceServers: RTCIceServer[],
    onIceCandidate: (candidate: RTCIceCandidate, callId: string) => void,
    callId: string,
    dataChannel_config?: {label:string},
) {
    const pc = useRef<RTCPeerConnection | null>(null);
    const dataChannels = useRef<{ [key: string]: RTCDataChannel }>({});
    const callIdRef = useRef(callId);
    // Update callIdRef whenever callId changes
    useEffect(() => {
        callIdRef.current = callId;
    }, [callId]);

    const setupPeerConnection = useCallback(() => {
        const peerConnection = new RTCPeerConnection({ iceServers });
        pc.current = peerConnection;
        console.log('PeerConnection created');

        // Set up ICE candidate handler
        peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                onIceCandidate(event.candidate, callIdRef.current);
            }
        };

        // Set up DataChannel handler
        peerConnection.ondatachannel = (event) => {
            const channel = event.channel;
            dataChannels.current[channel.label] = channel;
        };

        // Cleanup on unmount
        return () => {
            peerConnection.close();
        };
    }, [iceServers, onIceCandidate]);

    useEffect(() => {
        const cleanup = setupPeerConnection();
        return cleanup;
    }, [setupPeerConnection]);


    // Create offer
    const createOffer = useCallback(async () => {
        if (pc) {
            const offer = await pc.current?.createOffer();
            await pc.current?.setLocalDescription(offer);
            return offer;
        }
    }, [pc]);

    // Set remote answer
    const setRemoteAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
        if (pc) {
            await pc.current?.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }, [pc]);

    // Add ICE candidate
    const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        if (pc) {
            await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }, [pc]);

    return useMemo(() => ({
        pc,
        dataChannels,
        createOffer,
        setRemoteAnswer,
        addIceCandidate,
    }), [pc, dataChannels, createOffer, setRemoteAnswer, addIceCandidate]);
}

export default usePeerConnection;
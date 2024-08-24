class WebRTCConnection {
    private pc: RTCPeerConnection;
    private dataChannel: RTCDataChannel  | null = null;
    private callID:string = ""
    constructor() {
        this.pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10,
        });
        console.log('WebRTCConnection created');
        console.log(this.pc.onicecandidate)
    }
    public createDataChannel(label:string, onMessage: (data: ArrayBuffer) => void) {
        this.dataChannel = this.pc.createDataChannel('data');
        this.dataChannel.onopen = ()=>{
            console.log('Data channel open');
        }
        this.dataChannel.onmessage = (event) => {
            onMessage(event.data);
        };
    }

    public updateOnIceCandidate() {
        this.pc.onicecandidate = async (event) => {
            console.log('Ice candidate');
            if (event.candidate) {
                console.log(event.candidate)
                console.log("Event.Candidate", event.candidate);
                console.log("CallId", this.callID)

                await fetch('/api/add-ice-candidate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        callId: this.callID,
                        candidate: event.candidate.toJSON(),
                        type: 'offer'
                    })
                });
            }
        };
    }
    public setRemoteDescription(description: RTCSessionDescriptionInit) {
        this.pc.setRemoteDescription(description);
    }

    public createOffer = async () => {
        if (this.pc) {
            const offerDescription = await this.pc.createOffer();
            const response = await fetch('/api/create-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offer: offerDescription })
            });
            const data = await response.json();
            console.log(data);
            //setCallId(data.callId)
            this.callID = data.callId;
            this.pc.onicecandidate = async (event) => {
                console.log('Ice candidate');
                // if (event.candidate) {
                //     console.log(event.candidate)
                //     console.log("Event.Candidate", event.candidate);
                //     console.log("CallId", this.callID)
                //
                //     await fetch('/api/add-ice-candidate', {
                //         method: 'POST',
                //         headers: {'Content-Type': 'application/json'},
                //         body: JSON.stringify({
                //             callId: this.callID,
                //             candidate: event.candidate.toJSON(),
                //             type: 'offer'
                //         })
                //     });
                // }
            }
            await this.pc.setLocalDescription(offerDescription);
            console.log('Offer sent');
            console.log(this.pc.iceConnectionState)
            setTimeout(()=>{
                console.log("Here")
            },100 )
            return data.callId;

        }
    };
    public async addIceCandidate(candidate: RTCIceCandidateInit) {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    public getConnectionState() {
        return this.pc.connectionState;
    }
    public sendData(data: ArrayBuffer) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(data);
        }
    }

    public close() {
        this.pc.close();
    }
}
export default WebRTCConnection;
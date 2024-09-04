// app/page_everythingworksexceptfile.tsx
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode.react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

import { resolveMetadataItems } from "next/dist/lib/metadata/resolve-metadata";
export default function ShareBox() {
  //let callId: string;
  const [callId, setCallId] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const gatheredCandidates = useRef(false);
  const pc = useRef<RTCPeerConnection | null>(null);
  const data_channel = useRef<RTCDataChannel | null>(null);
  const feedback_channel = useRef<RTCDataChannel | null>(null);
  let listen_for_ice_candidates = useRef(false);
  const fileInputRef = useRef(null);
  const sendButtonRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const last_ack = useRef(0);
  let threshold = 100;

  const startTime = useRef(0);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [windowSizePercentage, setWindowSizePercentage] = useState(0);
  const [Chunk_size, setChunk_size] = useState(0);
  // Add this function to handle the slider change
  const [ControlVisible, setControlVisible] = useState(false);
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWindowSizePercentage(parseInt(event.target.value, 0));
  };

  const updateProgress = (transferredBytes: number) => {
    const percentage = (transferredBytes / (selectedFile?.size || 1)) * 100;
    setProgress(percentage);

    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime.current) / 1000; // in seconds
    const bytesPerSecond = transferredBytes / elapsedTime;
    setSpeed(bytesPerSecond / 1024); // convert to KBps
  };

  const handleFileClick = () => {
    if (fileInputRef.current) {
      // @ts-ignore
      fileInputRef.current.click();
    }
  };
  const router = useRouter();

  const handleBackClick = () => {
    if (pc.current?.connectionState === "connected") {
      if (
        confirm(
          "Any ongoing transfer will be canceled. Do you want to continue?",
        )
      ) {
        // Perform any cleanup or state reset needed here
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  const handleFileDrop = (event: {
    preventDefault: () => void;
    dataTransfer: { files: any };
  }) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange({ target: { files } });
    }
  };

  const handleFileChange = (event: { target: any }) => {
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
    if (typeof window !== "undefined") {
      pc.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
        iceCandidatePoolSize: 10,
      });
      data_channel.current = pc.current.createDataChannel("main");
      data_channel.current.binaryType = "arraybuffer";
      data_channel.current.onopen = (e) => {
        addLog("Connection Opened!");
      };
      data_channel.current.onmessage = (e) => {
        console.log("Received message: ", e.data);
      };

      feedback_channel.current = pc.current.createDataChannel("feedback");
      feedback_channel.current.binaryType = "arraybuffer";
      feedback_channel.current.onopen = (e) => {
        addLog("Feedback Connection Opened!");
      };
      feedback_channel.current.onmessage = (e) => {
        console.log("Received message: ", e.data);
        const data = JSON.parse(e.data);
        if (data.type === "feedback") {
          console.log("setting last ack: ", data.sequenceNumber);
          last_ack.current = data.sequenceNumber;
        }
      };
    }
  }, []); //Initialising

  // const handleNewICECandidate = async (event: RTCPeerConnectionIceEvent) => {
  //   console.log(JSON.stringify(pc.current?.localDescription?.sdp));
  //   console.log("SDP");
  //   if (event.candidate) {
  //     console.log("Event.Candidate", event.candidate);
  //     console.log("CallId", callId);
  //     addLog("Sending new ICE candidate");
  //     await fetch("/api/add-ice-candidate", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         callId,
  //         candidate: event.candidate.toJSON(),
  //         type: "offer",
  //       }),
  //     });
  //   }
  // };

  // useEffect(() => {
  //   if (pc.current) {
  //     pc.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
  //       handleNewICECandidate(event); // console.log("New Ice Candidate: ", event.candidate?.toJSON());
  //     };
  //   }
  // }, [callId, pc.current]); //updating callback
  const callId_Ref = useRef("");
  const [iceErorMessage, setIceErorMessage] = useState("");
  async function handleStartCall() {
    if (pc.current) {
      const offerDescription = await pc.current?.createOffer();
      const response = await fetch("/api/create-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer: offerDescription }),
      });

      const data = await response.json();
      console.log(data);
      callId_Ref.current = data.callId;
      setCallId(data.callId);
      setShareMessage("Initialising, please wait.");
      pc.current.onicegatheringstatechange = async () => {
        console.log("ICE Gathering State: ", pc.current?.iceGatheringState);
        if (pc.current?.iceGatheringState === "complete") {
          console.log("ICE Gathering Complete!");
          addLog("ICE Gathering Complete!");
          const res = await fetch("/api/update-offer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              callId: data.callId,
              offer: pc.current?.localDescription,
            }),
          });
          gatheredCandidates.current = true;
          setShareMessage(
            "Share this code with the recicever : " + callId_Ref.current,
          );
        }
      };

      // pc.current?.addEventListener("connectionstatechange", () => {
      //   console.log("Connection state: ", pc.current?.connectionState);
      //   if (pc.current?.connectionState === "connected") {
      //     console.log("Connection opened, starting file send...");
      //     addLog("Connection opened, starting file send...");
      //     data_channel.current?.addEventListener("open", handleFileSend);
      //   }
      // });
      data_channel.current?.addEventListener("open", handleFileSend);
      pc.current.addEventListener("icecandidateerror", (event) => {
        setIceErorMessage(
          "Failed to gather ICE candidates. This might be a browser problem, Please try again. If issue persists ensure both devices are on the same network." +
            "\n" +
            event.errorText,
        );
        pc.current?.close();
      });
      await pc.current?.setLocalDescription(offerDescription);
      addLog("Setting new local description!");
      initListen.current = true;
      return data.callId;
    }
  }
  const initListen = useRef(false);

  useEffect(() => {
    console.log("RUNNING EFECT");
    if (initListen.current && gatheredCandidates.current) {
      const interval = setInterval(async () => {
        const callData = await fetch("/api/get-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callId: callId }),
        }).then((res) => res.json());
        console.log("Call Data: ", callData);
        if (callData.answer && callData.answer.sdp)
          console.log(JSON.stringify(callData.answer.sdp));

        // @ts-ignore
        if (callData.answer && !pc.current.currentRemoteDescription) {
          console.log("Setting answer description: ", callData.answer);
          addLog("Setting answer description:");
          const answerDescription = new RTCSessionDescription(callData.answer);
          await pc.current?.setRemoteDescription(answerDescription);
          clearInterval(interval);

          for (const candidate of callData.answerCandidates) {
            await pc.current?.addIceCandidate(new RTCIceCandidate(candidate));
          }
          // console.log("State", pc.current?.connectionState)
          // if (pc.current?.connectionState == 'new'){
          //     handleFileSend();
          //}

          listen_for_ice_candidates.current = true;
        } else {
          addLog("Waiting for response");
        }
      }, 1000);
    }
  }, [initListen.current, gatheredCandidates.current]);

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

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     const file = e.target.files?.[0] || null;
  //     setFile(file);
  // };

  const handleFileSend = () => {
    console.log("Sending file");

    //get max chunk size
    const lc_descr = pc.current?.localDescription;
    const rc_descr = pc.current?.remoteDescription;

    const extractMaxMessageSize = (sdp: string | undefined): number | null => {
      if (!sdp) return null;
      const lines = sdp.split("\n");
      for (const line of lines) {
        if (line.startsWith("a=max-message-size:")) {
          const parts = line.split(":");
          if (parts.length === 2) {
            return parseInt(parts[1], 10);
          }
        }
      }
      return null;
    };

    const maxLcMessageSize = extractMaxMessageSize(lc_descr?.sdp);
    const maxRcMessageSize = extractMaxMessageSize(rc_descr?.sdp);

    console.log("Max LC Message Size:", maxLcMessageSize);
    console.log("Max RC Message Size:", maxRcMessageSize);
    let maxMessageSize = 0;
    if (maxLcMessageSize && maxRcMessageSize) {
      maxMessageSize = Math.min(maxLcMessageSize, maxRcMessageSize);
      console.log("Max Message Size:", maxMessageSize);
    }

    let chunkSize = maxMessageSize > 16384 ? 2 * 16384 - 16 : 16384 - 16;
    chunkSize = maxMessageSize > 2 * 16384 ? 3 * 16384 - 16 : chunkSize;
    if (Chunk_size > 0) {
      chunkSize = (Chunk_size / 100) * maxMessageSize;
    }
    if (windowSizePercentage > 0) {
      threshold = windowSizePercentage;
    }
    if (data_channel.current && selectedFile) {
      if (data_channel.current.readyState === "open") {
        // Prepare file details
        const fileDetails = {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          lastModified: selectedFile.lastModified,
        };

        // Send file details as JSON
        data_channel.current.send(
          JSON.stringify({
            type: "fileDetails",
            details: fileDetails,
            chunkSize,
            threshold,
          }),
        );

        const fileReader = new FileReader();
        let offset = 0;
        let sequenceNumber = 0;
        fileReader.addEventListener("error", (error) =>
          console.error("Error reading file:", error),
        );
        fileReader.addEventListener("abort", (event) =>
          console.log("File reading aborted:", event),
        );
        fileReader.addEventListener("load", (e) => {
          //  console.log('FileRead.onload ', e);
          // @ts-ignore
          const arrayBuffer = e.target.result as ArrayBuffer;
          const identifier = 1234; // Replace with your actual identifier
          const timestamp = Date.now();

          const metadataSize = 4 + 8 + 4; // identifier (4 bytes) + timestamp (8 bytes) + sequenceNumber (4 bytes)
          const totalSize = metadataSize + arrayBuffer.byteLength;

          const newArrayBuffer = new ArrayBuffer(totalSize);
          const view = new DataView(newArrayBuffer);

          view.setUint32(0, identifier); // Identifier (4 bytes)
          view.setBigUint64(4, BigInt(timestamp)); // Timestamp (8 bytes)
          view.setUint32(12, sequenceNumber++);

          const originalData = new Uint8Array(arrayBuffer);
          const newData = new Uint8Array(newArrayBuffer, metadataSize);
          newData.set(originalData);

          data_channel.current?.send(newArrayBuffer);
          offset += arrayBuffer.byteLength;
          updateProgress(offset);
          if (offset < selectedFile.size) {
            let timeout_time = 10;
            const waitForAck = () => {
              if (!(last_ack.current + threshold + 1 > sequenceNumber)) {
                // console.log(last_ack + 11)
                // console.log(sequenceNumber)
                // console.log(last_ack + 11 > sequenceNumber)
                console.log("Waiting for ack: ", last_ack, sequenceNumber);
                timeout_time = timeout_time + 2;
                setTimeout(waitForAck, timeout_time); // Wait for 100ms before checking again
              } else {
                timeout_time = 10;
                readSlice(offset);
              }
            };
            waitForAck();
          } else {
            // @ts-ignore
            data_channel.current.send(
              JSON.stringify({
                type: "fileTransferComplete",
                message: "File transfer completed",
              }),
            );
          }
        });
        const readSlice = (o: number) => {
          // console.log('readSlice ', o);
          const slice = selectedFile.slice(offset, o + chunkSize);
          fileReader.readAsArrayBuffer(slice);
        };
        startTime.current = Date.now();
        readSlice(0);

        // Send file data in chunks
        //const CHUNK_SIZE = 16384; // 16KB chunks
        // const CHUNK_SIZE = 1200
        // let offset = 0;
        //
        // const sendNextChunk = () => {
        //     if (offset < fileData.byteLength) {
        //         const chunk = fileData.slice(offset, offset + CHUNK_SIZE);
        //         // @ts-ignore
        //         data_channel.current.send(chunk);
        //         offset += CHUNK_SIZE;
        //         setTimeout(sendNextChunk, 10); // Slight delay to prevent overloading the channel
        //     } else {
        //         // @ts-ignor
        //     }
        // };
        //
        // sendNextChunk();
      } else {
        console.error("Data channel is not open");
      }
    }
  };

  const toggleTerminal = () => setTerminalVisible(!terminalVisible);
  const addLog = (message: string) =>
    setLogs((prevLogs: string[]) => [...prevLogs, message]);
  // @ts-ignore
  // @ts-ignore
  return (
    <div className="flex  min-h-svh  justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white h-fit mt-12 dark:bg-gray-800 m-6 p-6 rounded-lg shadow-lg relative pt-12  text-center">
        <button
          onClick={handleBackClick}
          className="absolute top-4 left-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 flex items-center space-x-2"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
          <span>Back</span>
        </button>
        {!sending && (
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
              <div className="flex flex-col md:min-w-72 items-center justify-center space-y-2 relative z-10">
                <p className="text-gray-600  dark:text-gray-300">
                  {selectedFile.name} <br></br>(
                  {(selectedFile.size / 1024).toFixed(2)} KB)
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
        )}{" "}
        {sending && selectedFile && selectedFile.name !== "" && (
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg p-10 relative overflow-hidden
                bg-white dark:bg-gray-800 hover:bg-gray-100 hover:dark:bg-gray-600 ease-in-out transition-colors duration-500
                aspect-square max-w-72 flex flex-col items-center justify-center space-y-4 text-center"
          >
            <div className="text-gray-600 dark:text-gray-300 flex-col flex items-center justify-center space-y-2 relative z-10">
              <p className="font-bold">{shareMessage}</p>
              <QRCode value={callId} size={128} />
              <p className="text-xl font-mono"></p>
            </div>
          </div>
        )}
        {/* Progress Bar */}
        {sending && (
          <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
            <div
              className="bg-blue-500 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
              style={{ width: `${progress}%` }}
            >
              {progress.toFixed(2)}%
            </div>
          </div>
        )}
        {/* Speed Tracker */}
        {sending && (
          <div className="mt-2 text-gray-600 dark:text-gray-300">
            {speed > 0 ? (
              <p>Speed: {speed.toFixed(2)} KB/s</p>
            ) : (
              <p>Calculating speed...</p>
            )}
          </div>
        )}
        {selectedFile && !sending && (
          <button
            ref={sendButtonRef}
            className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={async () => {
              // @ts-ignore
              sendButtonRef.current.disabled = true;
              const id = await handleStartCall();
              console.log("DONE");
              console.log(callId);
              if (id !== "") {
                setSending(true);
              }
            }}
          >
            Send
          </button>
        )}
        {iceErorMessage && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{iceErorMessage}</span>
          </div>
        )}
        <div className="mt-6">
          <button
            className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
            onClick={toggleTerminal}
          >
            {terminalVisible ? "Hide Terminal" : "Show Terminal"}
          </button>
          {terminalVisible && (
            <div className="mt-2 bg-black text-green-400 p-4 rounded-lg h-32 overflow-y-auto font-mono">
              {logs.length === 0 ? (
                <p>No logs yet...</p>
              ) : (
                logs.map((log, index) => <p key={index}>{log}</p>)
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            className="mt-1 w-full px-4 py-1  text-gray-600 rounded  text-sm"
            onClick={() => setControlVisible(!ControlVisible)}
          >
            {ControlVisible
              ? "Hide Advanced Controls"
              : "Show Advanced Controls"}
          </button>
          {ControlVisible && (
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md space-y-3">
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1 text-sm">
                  Window Size (in multiples of Chunk Size)
                </p>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={windowSizePercentage}
                  onChange={(e) => {
                    setWindowSizePercentage(parseInt(e.target.value, 10));
                  }}
                  className="h-2 bg-blue-400 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1 text-sm">
                  Chunk size (in % of Max Message Size)
                </p>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={Chunk_size}
                  onChange={(e) => {
                    setChunk_size(parseInt(e.target.value, 10));
                  }}
                  className="h-2 bg-green-400 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

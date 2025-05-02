import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import "./App.css";
import { drawHand } from "./utils";
import * as fp from "fingerpose";
import ThumbsDownGesture from "./gestures/ThumbsDown.js";
import MiddleFingerGesture from "./gestures/MiddleFinger.js";
import OKSignGesture from "./gestures/OKSign.js";
import PinchedFingerGesture from "./gestures/PinchedFinger.js";
import PinchedHandGesture from "./gestures/PinchedHand.js";
import RaisedHandGesture from "./gestures/RaisedHand.js";
import LoveYouGesture from "./gestures/LoveYou.js";
import RockOnGesture from "./gestures/RockOn.js";
import CallMeGesture from "./gestures/CallMe.js";
import PointUpGesture from "./gestures/PointUp.js";
import PointDownGesture from "./gestures/PointDown.js";
import PointRightGesture from "./gestures/PointRight.js";
import PointLeftGesture from "./gestures/PointLeft.js";
import RaisedFistGesture from "./gestures/RaisedFist.js";
import { aSign } from "./gestures/handsigns/Asign.js";
import { bSign } from "./gestures/handsigns/Bsign.js";
import { cSign } from "./gestures/handsigns/Csign.js";
import { dSign } from "./gestures/handsigns/Dsign.js";
import { eSign } from "./gestures/handsigns/Esign.js";
import { fSign } from "./gestures/handsigns/Fsign.js";
import { gSign } from "./gestures/handsigns/Gsign.js";
import { hSign } from "./gestures/handsigns/Hsign.js";
import { iSign } from "./gestures/handsigns/Isign.js";
import { jSign } from "./gestures/handsigns/Jsign.js";
import { kSign } from "./gestures/handsigns/Ksign.js";
import { lSign } from "./gestures/handsigns/Lsign.js";
import { mSign } from "./gestures/handsigns/Msign.js";
import { nSign } from "./gestures/handsigns/Nsign.js";
import { oSign } from "./gestures/handsigns/Osign.js";
import { pSign } from "./gestures/handsigns/Psign.js";
import { qSign } from "./gestures/handsigns/Qsign.js";
import { rSign } from "./gestures/handsigns/Rsign.js";
import { sSign } from "./gestures/handsigns/Ssign.js";
import { tSign } from "./gestures/handsigns/Tsign.js";
import { uSign } from "./gestures/handsigns/Usign.js";
import { vSign } from "./gestures/handsigns/Vsign.js";
import { wSign } from "./gestures/handsigns/Wsign.js";
import { xSign } from "./gestures/handsigns/Xsign.js";
import { ySign } from "./gestures/handsigns/Ysign.js";
import { zSign } from "./gestures/handsigns/Zsign.js";

import victory from "./img/victory.png";
import thumbs_up from "./img/thumbs_up.png";
import thumbs_down from "./img/thumbs_down.png";
import middle_finger from "./img/middle_finger.png";
import ok_sign from "./img/ok_sign.png";
import pinched_finger from "./img/pinched_finger.png";
import pinched_hand from "./img/pinched_hand.png";
import raised_hand from "./img/raised_hand.png";
import love_you from "./img/love_you.png";
import rock_on from "./img/rock_on.png";
import call_me from "./img/call_me.png";
import point_up from "./img/point_up.png";
import point_down from "./img/point_down.png";
import point_left from "./img/point_left.png";
import point_right from "./img/point_right.png";
import raised_fist from "./img/raised_fist.png";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const peerConnection = useRef(null);
  const dataChannel = useRef(null);
  const [isSender, setIsSender] = useState(true);
  const [emoji, setEmoji] = useState(null);
  const [receivedText, setReceivedText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");
  const pendingCandidates = useRef([]);
  const hasSetRemoteDescription = useRef(false);

  const images = {
    thumbs_up: thumbs_up,
    victory: victory,
    thumbs_down: thumbs_down,
    middle_finger: middle_finger,
    ok_sign: ok_sign,
    pinched_finger: pinched_finger,
    pinched_hand: pinched_hand,
    raised_hand: raised_hand,
    love_you: love_you,
    rock_on: rock_on,
    call_me: call_me,
    point_up: point_up,
    point_down: point_down,
    point_left: point_left,
    point_right: point_right,
    raised_fist: raised_fist,
  };

  useEffect(() => {
    // Clear any existing data in localStorage when switching roles
    if (isSender) {
      localStorage.removeItem("answer");
      localStorage.removeItem("iceCandidates");
    } else {
      localStorage.removeItem("offer");
      localStorage.removeItem("iceCandidates");
    }
    hasSetRemoteDescription.current = false;
    setupWebRTC();
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, [isSender]);

  // Handle signaling
  useEffect(() => {
    const handleSignaling = async () => {
      if (!peerConnection.current) return;

      try {
        if (isSender) {
          // Sender creates and stores offer
          if (
            peerConnection.current.signalingState === "stable" &&
            !localStorage.getItem("offer")
          ) {
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            localStorage.setItem("offer", JSON.stringify(offer));
            setConnectionStatus("Offer created, waiting for answer...");
          }

          // Check for answer
          const answer = localStorage.getItem("answer");
          if (
            answer &&
            !hasSetRemoteDescription.current &&
            peerConnection.current.signalingState === "have-local-offer"
          ) {
            const parsedAnswer = JSON.parse(answer);
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(parsedAnswer)
            );
            hasSetRemoteDescription.current = true;
            setConnectionStatus(
              "Answer received, processing ICE candidates..."
            );

            // Process any pending candidates
            while (pendingCandidates.current.length > 0) {
              const candidate = pendingCandidates.current.shift();
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            }
          }
        } else {
          // Receiver checks for offer
          const offer = localStorage.getItem("offer");
          if (
            offer &&
            !hasSetRemoteDescription.current &&
            peerConnection.current.signalingState === "stable"
          ) {
            const parsedOffer = JSON.parse(offer);
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(parsedOffer)
            );
            hasSetRemoteDescription.current = true;
            setConnectionStatus("Offer received, creating answer...");

            // Process any pending candidates
            while (pendingCandidates.current.length > 0) {
              const candidate = pendingCandidates.current.shift();
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            }

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            localStorage.setItem("answer", JSON.stringify(answer));
            setConnectionStatus("Answer created and sent");
          }
        }

        // Handle ICE candidates
        const candidates = JSON.parse(
          localStorage.getItem("iceCandidates") || "[]"
        );
        if (candidates.length > 0) {
          if (peerConnection.current.remoteDescription) {
            for (const candidate of candidates) {
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            }
            localStorage.setItem("iceCandidates", "[]"); // Clear processed candidates
          } else {
            // Store candidates for later processing
            pendingCandidates.current.push(...candidates);
          }
        }
      } catch (error) {
        console.error("Signaling error:", error);
        setConnectionStatus("Error during signaling: " + error.message);
      }
    };

    const interval = setInterval(handleSignaling, 1000);
    return () => clearInterval(interval);
  }, [isSender]);

  const setupWebRTC = async () => {
    try {
      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      };

      peerConnection.current = new RTCPeerConnection(configuration);
      setConnectionStatus("WebRTC connection created");

      if (isSender) {
        // Create data channel for sender
        dataChannel.current = peerConnection.current.createDataChannel(
          "gestureChannel",
          {
            ordered: true,
          }
        );

        dataChannel.current.onopen = () => {
          console.log("Data channel is open");
          setIsConnected(true);
          setConnectionStatus("Connected");
        };

        dataChannel.current.onclose = () => {
          console.log("Data channel is closed");
          setIsConnected(false);
          setConnectionStatus("Disconnected");
        };

        dataChannel.current.onerror = (error) => {
          console.error("Data channel error:", error);
          setConnectionStatus("Data channel error");
        };
      } else {
        // Set up receiver
        peerConnection.current.ondatachannel = (event) => {
          console.log("Data channel received");
          dataChannel.current = event.channel;

          dataChannel.current.onmessage = (event) => {
            try {
              console.log("Raw message received:", event.data);
              const data = JSON.parse(event.data);
              if (data.type === "gesture") {
                console.log(
                  "Gesture received:",
                  data.name,
                  "with confidence:",
                  data.confidence
                );
                setReceivedText(data.name);
              }
            } catch (error) {
              console.error("Error processing received message:", error);
            }
          };

          dataChannel.current.onopen = () => {
            console.log("Data channel is open");
            setIsConnected(true);
            setConnectionStatus("Connected");
          };

          dataChannel.current.onclose = () => {
            console.log("Data channel is closed");
            setIsConnected(false);
            setConnectionStatus("Disconnected");
          };

          dataChannel.current.onerror = (error) => {
            console.error("Data channel error:", error);
            setConnectionStatus("Data channel error");
          };
        };
      }

      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("New ICE candidate:", event.candidate);
          const candidates = JSON.parse(
            localStorage.getItem("iceCandidates") || "[]"
          );
          candidates.push(event.candidate);
          localStorage.setItem("iceCandidates", JSON.stringify(candidates));
        }
      };

      // Handle connection state changes
      peerConnection.current.onconnectionstatechange = () => {
        console.log(
          "Connection state:",
          peerConnection.current.connectionState
        );
        setConnectionStatus(peerConnection.current.connectionState);
      };

      peerConnection.current.oniceconnectionstatechange = () => {
        console.log(
          "ICE Connection State:",
          peerConnection.current.iceConnectionState
        );
        if (peerConnection.current.iceConnectionState === "connected") {
          setIsConnected(true);
          setConnectionStatus("Connected");
        } else if (
          peerConnection.current.iceConnectionState === "disconnected" ||
          peerConnection.current.iceConnectionState === "failed"
        ) {
          setIsConnected(false);
          setConnectionStatus("Disconnected");
        }
      };
    } catch (error) {
      console.error("Error setting up WebRTC:", error);
      setConnectionStatus("Error setting up WebRTC: " + error.message);
    }
  };

  const runHandpose = async () => {
    const net = await handpose.load();
    //console.log("handpose model loaded");
    // loop and detect hand
    setInterval(() => {
      detect(net);
    }, 100);
  };
  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current != null &&
      webcamRef.current.video.readyState === 4
    ) {
      // get video properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;
      // set video width and height
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      // set canvas width and height
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      // make detection
      const hand = await net.estimateHands(video);

      if (hand.length > 0) {
        const GE = new fp.GestureEstimator([
          fp.Gestures.VictoryGesture,
          fp.Gestures.ThumbsUpGesture,
          ThumbsDownGesture,
          MiddleFingerGesture,
          OKSignGesture,
          PinchedFingerGesture,
          PinchedHandGesture,
          RaisedHandGesture,
          LoveYouGesture,
          RockOnGesture,
          CallMeGesture,
          PointRightGesture,
          PointUpGesture,
          PointLeftGesture,
          PointDownGesture,
          RaisedFistGesture,
          aSign,
          bSign,
          cSign,
          dSign,
          eSign,
          fSign,
          gSign,
          hSign,
          iSign,
          jSign,
          kSign,
          lSign,
          mSign,
          nSign,
          oSign,
          pSign,
          qSign,
          rSign,
          sSign,
          tSign,
          uSign,
          vSign,
          wSign,
          xSign,
          ySign,
          zSign,
        ]);
        const gesture = await GE.estimate(hand[0].landmarks, 8);
        if (gesture.gestures !== undefined && gesture.gestures.length > 0) {
          const confidence = gesture.gestures.map(
            (prediction) => prediction.score
          );
          const maxConfidence = confidence.indexOf(
            Math.max.apply(null, confidence)
          );
          const gestureName = gesture.gestures[maxConfidence].name;
          setEmoji(gestureName);

          // Send gesture text through WebRTC
          if (
            isSender &&
            isConnected &&
            dataChannel.current &&
            dataChannel.current.readyState === "open"
          ) {
            try {
              console.log("Sending gesture:", gestureName);
              dataChannel.current.send(
                JSON.stringify({
                  type: "gesture",
                  name: gestureName,
                  confidence: gesture.gestures[maxConfidence].score,
                })
              );
            } catch (error) {
              console.error("Error sending gesture:", error);
            }
          }
        }
      }

      // Draw mesh
      const ctx = canvasRef.current.getContext("2d");
      drawHand(hand, ctx);
    }
  };

  useEffect(() => {
    runHandpose();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="video-container">
          <div className="video-box">
            <h3>{isSender ? "Sender View" : "Receiver View"}</h3>
            <Webcam
              ref={webcamRef}
              style={{
                position: "relative",
                width: 640,
                height: 480,
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 640,
                height: 480,
              }}
            />
          </div>

          {!isSender && (
            <div className="text-display">
              <h3>Received Gesture:</h3>
              <div className="received-text">
                {receivedText || "Waiting for gesture..."}
              </div>
              <div className="connection-info">
                Data Channel: {dataChannel.current?.readyState || "not created"}
              </div>
            </div>
          )}
        </div>

        <div className="controls">
          <button onClick={() => setIsSender(!isSender)}>
            Switch to {isSender ? "Receiver" : "Sender"} View
          </button>
          <div className="connection-status">{connectionStatus}</div>
        </div>
      </header>
    </div>
  );
}

export default App;

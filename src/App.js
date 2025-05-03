import React, { useRef, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
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
import io from 'socket.io-client';

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

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Gesture Bridge</h1>
      <div className="role-selection">
        <button 
          className="role-button sender"
          onClick={() => navigate('/sender')}
        >
          Start as Sender
        </button>
        <button 
          className="role-button receiver"
          onClick={() => navigate('/receiver')}
        >
          Start as Receiver
        </button>
      </div>
    </div>
  );
}

function VideoCall({ role }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const peerConnection = useRef(null);
  const dataChannel = useRef(null);
  const socketRef = useRef(null);
  const [isSender, setIsSender] = useState(role === 'sender');
  const [emoji, setEmoji] = useState(null);
  const [receivedText, setReceivedText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");
  const navigate = useNavigate();

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
    // Initialize Socket.IO connection
    socketRef.current = io('https://5b91-2409-40c1-5f-5f2c-575-e0c8-86e0-72a4.ngrok-free.app');

    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
      setConnectionStatus('Connected to signaling server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from signaling server');
      setConnectionStatus('Disconnected from signaling server');
    });

    setupWebRTC();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
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
        dataChannel.current = peerConnection.current.createDataChannel("gestureChannel");
        
        dataChannel.current.onopen = () => {
          setIsConnected(true);
          setConnectionStatus("Connected");
        };
        
        dataChannel.current.onclose = () => {
          setIsConnected(false);
          setConnectionStatus("Disconnected");
        };

        // Create and send offer
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socketRef.current.emit('offer', offer);
      } else {
        peerConnection.current.ondatachannel = (event) => {
          dataChannel.current = event.channel;
          
          dataChannel.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "gesture") {
              setReceivedText(data.name);
            }
          };
          
          dataChannel.current.onopen = () => {
            setIsConnected(true);
            setConnectionStatus("Connected");
          };
          
          dataChannel.current.onclose = () => {
            setIsConnected(false);
            setConnectionStatus("Disconnected");
          };
        };
      }

      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', event.candidate);
        }
      };

      // Listen for signaling events
      socketRef.current.on('offer', async (offer) => {
        if (!isSender) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socketRef.current.emit('answer', answer);
        }
      });

      socketRef.current.on('answer', async (answer) => {
        if (isSender) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      socketRef.current.on('ice-candidate', async (candidate) => {
        if (peerConnection.current.remoteDescription) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      peerConnection.current.onconnectionstatechange = () => {
        setConnectionStatus(peerConnection.current.connectionState);
      };

    } catch (error) {
      console.error("Error setting up WebRTC:", error);
      setConnectionStatus("Error setting up WebRTC: " + error.message);
    }
  };

  const runHandpose = async () => {
    const net = await handpose.load();
    // Reduce interval time from 100ms to 50ms for faster response
    setInterval(() => {
      detect(net);
    }, 50);
  };

  const detect = async (net) => {
    if (typeof webcamRef.current !== "undefined" && 
        webcamRef.current != null && 
        webcamRef.current.video.readyState === 4) {
      
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;
      
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      
      const hand = await net.estimateHands(video);

      if (hand.length > 0) {
        const GE = new fp.GestureEstimator([
          fp.Gestures.VictoryGesture,
          fp.Gestures.ThumbsUpGesture,
          ThumbsDownGesture,
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
          // aSign,
          // bSign,
          // cSign,
          // dSign,
          // eSign,
          // fSign,
          // gSign,
          // hSign,
          // iSign,
          // jSign,
          // kSign,
          // lSign,
          // mSign,
          // nSign,
          // oSign,
          // pSign,
          // qSign,
          // rSign,
          // sSign,
          // tSign,
          // uSign,
          // vSign,
          // wSign,
          // xSign,
          // ySign,
          // zSign,
        ]);
        const gesture = await GE.estimate(hand[0].landmarks, 8);
        if (gesture.gestures !== undefined && gesture.gestures.length > 0) {
          const confidence = gesture.gestures.map(prediction => prediction.score);
          const maxConfidence = confidence.indexOf(Math.max.apply(null, confidence));
          const gestureName = gesture.gestures[maxConfidence].name;
          const confidenceScore = gesture.gestures[maxConfidence].score;
          
          // Lower confidence threshold from 0.7 to 0.6 for faster response
          if (confidenceScore > 0.6) {
            console.log('confidenceScore :', confidenceScore);
            setEmoji(gestureName);
            
            if (isSender && dataChannel.current?.readyState === "open") {
              const message = JSON.stringify({
                type: "gesture",
                name: gestureName,
                confidence: confidenceScore
              });
              dataChannel.current.send(message);
            }
          }
        }
      }

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
                <div>Data Channel: {dataChannel.current?.readyState || 'not created'}</div>
                <div>Connection: {connectionStatus}</div>
                <div>Last Received: {receivedText}</div>
              </div>
            </div>
          )}
        </div>

        <div className="controls">
          <button onClick={() => navigate('/')}>
            Back to Home
          </button>
          <div className="connection-status">{connectionStatus}</div>
        </div>
      </header>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sender" element={<VideoCall role="sender" />} />
        <Route path="/receiver" element={<VideoCall role="receiver" />} />
      </Routes>
    </Router>
  );
}

export default App;

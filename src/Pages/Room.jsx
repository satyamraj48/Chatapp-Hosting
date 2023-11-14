import React, { useContext, useEffect, useState } from "react";
import { CallContext, UserContext } from "./UserContext";
import ReactPlayer from "react-player";
import { useNavigate } from "react-router-dom";
import { MdCallEnd } from "react-icons/md";
import {
	BiSolidPhoneCall,
	BiSolidVideo,
	BiSolidVideoOff,
} from "react-icons/bi";
import { AiFillAudio, AiOutlineAudioMuted } from "react-icons/ai";
import peer from "../components/common/peer";

function Room() {
	const { socket } = useContext(UserContext);
	const {
		audioCall,
		videoCall,
		setAudioCall,
		setVideoCall,
		remoteSocketId,
		setRemoteSocketId,
	} = useContext(CallContext);

	const [myStream, setMyStream] = useState(null);
	const [remoteStream, setRemoteStream] = useState(null);
	const [incomingCallInfo, setIncomingCallInfo] = useState({});
	const [callAccept, setCallAccept] = useState(null);
	const [viewVideoFull, setViewVideoFull] = useState(true);

	async function handleIncomingCall({ from, offer, isVideoCall }) {
		console.log("Incoming Call from ->", from, " and offer is -> ", offer);

		// incoming calls button
		if (callAccept) {
			const ans = await peer.getAnswer(offer);
			socket.emit("call:accepted", { to: from, ans });
			console.log("call accept true");
		} else {
			const localStream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: isVideoCall,
			});
			setMyStream(localStream);
			setRemoteSocketId(from);
			console.log("incoming call info");
			setIncomingCallInfo({ from, offer });
		}
	}

	useEffect(() => {
		if (callAccept) {
			handleIncomingCall({
				from: incomingCallInfo.from,
				offer: incomingCallInfo.offer,
			});
		}
	}, [callAccept]);

	async function handleCallAccepted({ from, ans }) {
		console.log("Call Accepted -> ", from, "and answer->", ans);
		await peer.setRemoteAnswer(ans);
		// sendStreams();
	}

	async function handleNegotiationIncoming({ from, offer }) {
		const ans = await peer.getAnswer(offer);
		socket.emit("peer:nego:done", { to: from, ans });
	}
	async function handleNegotiationFinal({ from, ans }) {
		console.log("Negotiation Final");
		await peer.setRemoteAnswer(ans);
		// sendStreams();
	}

	function handleCancelVideoCall({ from }) {
		setMyStream(null);
		setRemoteStream(null);
		setAudioCall(false);
		setVideoCall(false);
		navigate("/");
	}

	//audio call button click
	const handleAudioCallUser = async () => {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
		});
		const offer = await getOffer();
		socket.emit("user:call", { to: remoteSocketId, offer, isVideoCall: false });
		setMyStream(stream);
	};
	//video call button click
	const handleVideoCallUser = async () => {
		const localStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true,
		});
		const offer = await peer.getOffer();
		socket.emit("user:call", { to: remoteSocketId, offer, isVideoCall: true });
		setMyStream(localStream);
	};
	function handleRemotePersonJoined({ joined }) {
		if (joined && remoteSocketId) {
			console.log("7 handleRemotePersonJoined recieved and start video call");
			if (videoCall) {
				handleVideoCallUser();
			} else if (audioCall) {
				handleAudioCallUser();
			}
		}
	}
	function handleNewUserJoined({ emailId, joinerId }) {
		console.log(
			"Room mei-> new user joined room",
			emailId,
			"s-id-> ",
			joinerId
		);
		setRemoteSocketId(joinerId);
	}

	useEffect(() => {
		socket.on("user:joined", handleNewUserJoined);
		socket.on("incoming:call", handleIncomingCall);
		socket.on("call:accepted", handleCallAccepted);
		socket.on("peer:nego:needed", handleNegotiationIncoming);
		socket.on("peer:nego:final", handleNegotiationFinal);
		socket.on("cancel:videoCall", handleCancelVideoCall);
		socket.on("remote:person:joined:flag", handleRemotePersonJoined);

		return () => {
			socket.off("user:joined", handleNewUserJoined);
			socket.off("incoming:call", handleIncomingCall);
			socket.off("call:accepted", handleCallAccepted);
			socket.off("peer:nego:needed", handleNegotiationIncoming);
			socket.off("peer:nego:final", handleNegotiationFinal);
			socket.off("cancel:videoCall", handleCancelVideoCall);
			socket.off("remote:person:joined", handleRemotePersonJoined);
		};
	}, [
		handleRemotePersonJoined,
		handleCancelVideoCall,
		handleNegotiationFinal,
		handleNegotiationIncoming,
		handleCallAccepted,
		handleIncomingCall,
		handleNewUserJoined,
		socket,
	]);

	async function handleNegotiation() {
		console.log("Negotiation needed!");
		const offer = await peer.getOffer();
		socket.emit("peer:nego:needed", {
			to: remoteSocketId,
			offer,
		});
	}

	useEffect(() => {
		peer.peer.addEventListener("negotiationneeded", handleNegotiation);
		return () => {
			peer.peer.removeEventListener("negotiationneeded", handleNegotiation);
		};
	}, [handleNegotiation, peer]);

	const sendStreams = () => {
		for (const track of myStream.getTracks()) {
			peer.peer.addTrack(track, myStream);
		}
	};

	const handleTrackEvent = async (ev) => {
		const incomingStreams = ev.streams;
		console.log("GOT TRACKS!!");
		setRemoteStream(incomingStreams[0]);
	};

	useEffect(() => {
		peer.peer.addEventListener("track", handleTrackEvent);
		return () => {
			peer.peer.removeEventListener("track", handleTrackEvent);
		};
	}, [handleTrackEvent, peer]);

	const navigate = useNavigate();

	const cancelVideoCall = () => {
		setMyStream(null);
		setRemoteStream(null);
		setCallAccept(null);
		setAudioCall(false);
		setVideoCall(false);
		navigate("/");
		socket.emit("cancel:videoCall", { to: remoteSocketId });
	};

	const [isAudio, setIsAudio] = useState(true);
	const [isVideo, setIsVideo] = useState(true);

	return (
		<div className="relative bg-doodle-pattern bg-contain w-screen h-screen flex flex-col items-center">
			<h4 className="mt-1 text-xs">
				{remoteSocketId ? "Connected" : "Not Connected"}
			</h4>
			{(audioCall || videoCall) && !remoteStream && (
				<div className="mt-2 px-4 py-2 bg-blue-900 shadow-md rounded-lg border text-white">
					<div className=" text-md animate-pulse">Calling...</div>
				</div>
			)}

			<div
				className={`mt-5 w-full h-[80%] bg-pink-30 flex ${
					viewVideoFull
						? "lg:flex-row flex-col"
						: "lg:flex-row-reverse flex-col-reverse"
				} items-center justify-center gap-1`}
			>
				{myStream && (
					<div
						className={`absolute md:static md:w-[45%] ${
							viewVideoFull
								? "w-full h-full"
								: "bottom-2 right-2 z-[100] w-[30%] drop-shadow-md cursor-pointer"
						}`}
						onClick={() => {
							if (!viewVideoFull) {
								setViewVideoFull(!viewVideoFull);
							}
						}}
					>
						<>
							{/* <p>My Stream</p> */}
							<ReactPlayer
								width={"100%"}
								height={"100%"}
								url={myStream}
								playing
								muted
							/>
						</>
					</div>
				)}
				{remoteStream && (
					<div
						className={`absolute md:static md:w-[45%] ${
							!viewVideoFull
								? "w-full h-full"
								: "bottom-2 right-2 z-[100] w-[30%] drop-shadow-md cursor-pointer"
						}`}
						onClick={() => {
							if (viewVideoFull) {
								setViewVideoFull(!viewVideoFull);
							}
						}}
					>
						<>
							{/* <p>Remote Stream</p> */}
							<ReactPlayer
								width={"100%"}
								height={"100%"}
								url={remoteStream}
								playing
								// muted
							/>
						</>
					</div>
				)}

				<div className="absolute z-[300] bg-yellow-20 w-fit flex flex-col items-center justify-center">
					{!videoCall && !callAccept && (
						<p className="bg-blue-800/70 shadow-md px-5 py-2 rounded-md text-md text-white font-semibold text-center">
							Incoming call
							<span className="animate-pulse tracking-widest">...</span>
						</p>
					)}
					<div className="flex items-center justify-around gap-8">
						{!videoCall && !callAccept && (
							<button
								className="mt-5 bg-green-500/80 shadow-md text-white rounded-full p-2 md:p-5 animate-bounce"
								onClick={() => setCallAccept(true)}
							>
								<BiSolidPhoneCall className="text-3xl" />
							</button>
						)}
						{!videoCall && !callAccept && (
							<button
								className={`my-10 bg-red-500/80 shadow-md text-white rounded-full p-2 md:p-5`}
								onClick={cancelVideoCall}
							>
								<MdCallEnd className="text-2xl" />
							</button>
						)}
					</div>
				</div>
			</div>
			{/* cancel button after call recieved */}
			{(audioCall || videoCall || callAccept) && (
				<div className="absolute md:static bottom-5 z-[200] md:my-4 bg-yellow-40 md:h-[70px] flex items-center gap-4">
					<button
						className={`bg-red-500 shadow-md text-white rounded-full p-2 md:p-5`}
						onClick={cancelVideoCall}
					>
						<MdCallEnd className="text-2xl" />
					</button>
					<button
						className={`${
							!isVideo ? "bg-blue-400" : "bg-gray-400"
						} shadow-md text-white rounded-full p-2 md:p-5 transition-all duration-200`}
						onClick={() => {
							if (myStream) {
								sendStreams();
								setIsVideo(!isVideo);
								// myStream.getVideoTracks()[0].enabled = isVideo;
							}
						}}
					>
						{myStream && !isVideo ? (
							<BiSolidVideo className="text-2xl" />
						) : (
							<BiSolidVideoOff className="text-2xl" />
						)}
					</button>
					<button
						className={`${
							!isAudio ? "bg-green-400" : "bg-gray-400"
						} shadow-md text-white rounded-full p-2 md:p-5 transition-all duration-200`}
						onClick={() => {
							if (myStream) {
								setIsAudio(!isAudio);
								myStream.getAudioTracks()[0].enabled = isAudio;
							}
						}}
					>
						{myStream && !isAudio ? (
							<AiFillAudio className="text-2xl" />
						) : (
							<AiOutlineAudioMuted className="text-2xl" />
						)}
					</button>
				</div>
			)}
		</div>
	);
}

export default Room;

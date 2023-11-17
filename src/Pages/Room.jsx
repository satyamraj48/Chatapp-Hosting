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
	const [remoteUsername, setRemoteUsername] = useState("");
	const [incomingCallInfo, setIncomingCallInfo] = useState({});
	const [callAccept, setCallAccept] = useState(null);
	const [viewVideoFull, setViewVideoFull] = useState(true);
	const [isIncomingVideoCall, setIsIncomingVideoCall] = useState(false);
	const [displayVideoCallButton, setDisplayVideoCallButton] = useState(false);
	const [isAudio, setIsAudio] = useState(false);
	const [isVideo, setIsVideo] = useState(false);

	const navigate = useNavigate();

	async function handleIncomingCall({
		from,
		fromUsername,
		offer,
		isVideoCall,
	}) {
		// console.log("Incoming Call from ->", from, " and offer is -> ", offer);

		setRemoteUsername(fromUsername);

		// incoming calls button
		if (callAccept) {
			const ans = await peer.getAnswer(offer);
			socket.emit("call:accepted", { to: from, ans });
			// console.log("call accept true");
		} else {
			const localStream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: isVideoCall,
			});
			setMyStream(localStream);
			setIsIncomingVideoCall(isVideoCall);
			setRemoteSocketId(from);
			console.log("incoming call info");
			setIncomingCallInfo({ from, offer });
		}
	}
	useEffect(() => {
		if (callAccept) handleIncomingCall(incomingCallInfo);
	}, [callAccept]);
	async function handleCallAccepted({ from, ans }) {
		console.log("Call Accepted -> ", from, "and answer->", ans);
		await peer.setRemoteAnswer(ans);
	}

	async function handleNegotiationIncoming({ from, offer }) {
		const ans = await peer.getAnswer(offer);
		socket.emit("peer:nego:done", { to: from, ans });
	}
	async function handleNegotiationFinal({ from, ans }) {
		// console.log("Negotiation Final");
		await peer.setRemoteAnswer(ans);
	}

	function handleCancelCall({ from }) {
		setMyStream(null);
		setRemoteStream(null);
		setAudioCall(false);
		setVideoCall(false);
		navigate("/");
		window.location.reload();
	}

	//audio call button click
	const handleAudioCallUser = async () => {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
		});
		const offer = await peer.getOffer();
		socket.emit("user:call", { to: remoteSocketId, offer, isVideoCall: false });
		setMyStream(stream);
		setIsIncomingVideoCall(false);
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
		setIsIncomingVideoCall(true);
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
		socket.on("cancel:videoCall", handleCancelCall);
		socket.on("remote:person:joined:flag", handleRemotePersonJoined);

		return () => {
			socket.off("user:joined", handleNewUserJoined);
			socket.off("incoming:call", handleIncomingCall);
			socket.off("call:accepted", handleCallAccepted);
			socket.off("peer:nego:needed", handleNegotiationIncoming);
			socket.off("peer:nego:final", handleNegotiationFinal);
			socket.off("cancel:videoCall", handleCancelCall);
			socket.off("remote:person:joined", handleRemotePersonJoined);
		};
	}, [
		handleRemotePersonJoined,
		handleCancelCall,
		handleNegotiationFinal,
		handleNegotiationIncoming,
		handleCallAccepted,
		handleIncomingCall,
		handleNewUserJoined,
		socket,
	]);

	async function handleNegotiation() {
		// console.log("Negotiation needed!");
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

	const sendStreams = () => {
		setDisplayVideoCallButton(true);
		for (const track of myStream.getTracks()) {
			peer.peer.addTrack(track, myStream);
		}
	};

	const cancelCall = () => {
		socket.emit("cancel:videoCall", { to: remoteSocketId });
		setMyStream(null);
		setRemoteStream(null);
		setCallAccept(null);
		setAudioCall(false);
		setVideoCall(false);
		navigate("/");
		window.location.reload();
	};

	return (
		<div className="relative bg-doodle-pattern bg-contain w-screen h-screen flex flex-col items-center">
			{/* display remote is Connected or not */}
			<div
				className={`mx-10 w-[99%] h-[2px] rounded-full ${
					remoteSocketId ? "bg-green-400" : "bg-red-400"
				} `}
			></div>

			<div
				className={`mt-5 w-full h-[80%] bg-pink-30 flex ${
					viewVideoFull
						? "lg:flex-row flex-col"
						: "lg:flex-row-reverse flex-col-reverse"
				} items-center justify-center gap-1`}
			>
				{/* display myStream */}
				{myStream && (
					<div
						className={`absolute md:static md:w-[45%] ${
							!isIncomingVideoCall && "hidden"
						} ${
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

				{/* display remoteStream */}
				{remoteStream && (
					<div
						className={`absolute md:static md:w-[45%] ${
							!isIncomingVideoCall && "hidden"
						} ${
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

				{/* overlay after call recieved, both sender and reciever side only for Audio Call */}
				{(callAccept || audioCall) && !isIncomingVideoCall && (
					<div className="mt-2 px-4 py-2 bg-blue-900 shadow-md rounded-md border border-gray-400 text-white">
						<div className="text-md">
							Audio Calling
							<span className="animate-pulse tracking-widest">...</span>
						</div>
					</div>
				)}

				{/* sender side overlay notifications */}
				{videoCall && !remoteStream && (
					<div className="absolute mt-2 px-6 py-2 bg-blue-900 shadow-md shadow-black/20 rounded-md border border-gray-400 text-white">
						<div className="text-md animate-pulse">Calling...</div>
					</div>
				)}

				{/* reciever side incoming call overlay notifications */}
				{(audioCall && !callAccept) ||
					(!videoCall && !callAccept && (
						<div
							className={`absolute z-[300] px-8 py-2 bg-yellow-200/10 ${
								!isIncomingVideoCall && "border"
							} rounded-lg flex flex-col items-center justify-center`}
						>
							<img
								src={`https://api.dicebear.com/5.x/initials/svg?seed=${remoteUsername}`}
								className="mt-6 aspect-square h-16 bg-white rounded-full object-cover shadow-md shadow-black/10 border-2 border-white"
							/>
							<p
								className={`mt-2 px-3 py-[2px] rounded-md ${
									isIncomingVideoCall ? "text-white" : "text-gray-800"
								} text-xl font-semibold capitalize`}
							>
								{remoteUsername}
							</p>
							<p className="mt-1 bg-blue-500 border border-gray-300 shadow-lg shadow-black/20 px-2 py-1 rounded-md text-sm text-white font-semibold text-center">
								Incoming call
								<span className="animate-pulse tracking-widest">...</span>
							</p>
							<div className="mt-16 flex items-center justify-around gap-14">
								<button
									className="mt-5 bg-green-500/80 shadow-lg shadow-black/20 text-white rounded-full p-3 md:p-5 animate-bounce"
									onClick={() => setCallAccept(true)}
								>
									<BiSolidPhoneCall className="text-3xl" />
								</button>
								<button
									className={`mt-10 mb-5 bg-red-500/90 shadow-lg shadow-black/20 text-white rounded-full p-3 md:p-5`}
									onClick={cancelCall}
								>
									<MdCallEnd className="text-2xl" />
								</button>
							</div>
						</div>
					))}
			</div>

			{/* buttons after call recieved */}
			{(audioCall || videoCall || callAccept) && (
				<div
					className={`absolute md:static bottom-5 ${
						remoteStream && !audioCall && "left-5"
					} z-[200] md:my-4 bg-yellow-40 md:h-[70px] flex items-center gap-4`}
				>
					{!displayVideoCallButton && (
						<button
							className={`bg-blue-500 shadow-md text-white rounded-md px-4 py-2`}
							onClick={sendStreams}
						>
							Send{isIncomingVideoCall ? " Video" : " Audio"}
						</button>
					)}

					{displayVideoCallButton && (
						<button
							className={`${
								!isAudio ? "bg-green-500" : "bg-gray-400"
							} shadow-md text-white rounded-full p-3 md:p-5 transition-all duration-200`}
							onClick={() => {
								if (myStream) {
									setIsAudio(!isAudio);
									myStream.getAudioTracks()[0].enabled = isAudio;
								}
							}}
						>
							{myStream && !isAudio ? (
								<AiFillAudio className="text-2xl md:text-3xl" />
							) : (
								<AiOutlineAudioMuted className="text-2xl md:text-3xl" />
							)}
						</button>
					)}

					{!audioCall && isIncomingVideoCall && displayVideoCallButton && (
						<button
							className={`${
								!isVideo ? "bg-blue-500" : "bg-gray-400"
							} shadow-md text-white rounded-full p-3 md:p-5 transition-all duration-200`}
							onClick={() => {
								if (myStream) {
									console.log("is-> ", isVideo);
									setIsVideo(!isVideo);
									myStream.getVideoTracks()[0].enabled = isVideo;
								}
							}}
						>
							{myStream && !isVideo ? (
								<BiSolidVideo className="text-2xl md:text-3xl" />
							) : (
								<BiSolidVideoOff className="text-2xl md:text-3xl" />
							)}
						</button>
					)}

					{displayVideoCallButton && (
						<button
							className={`bg-red-500 shadow-md text-white rounded-full p-3 md:p-5`}
							onClick={cancelCall}
						>
							<MdCallEnd className="text-2xl md:text-3xl" />
						</button>
					)}
				</div>
			)}
		</div>
	);
}

export default Room;

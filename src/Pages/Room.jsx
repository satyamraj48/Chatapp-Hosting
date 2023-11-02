import React, { useContext, useEffect, useState } from "react";
import { CallContext, UserContext } from "./UserContext";
import ReactPlayer from "react-player";
import { useNavigate } from "react-router-dom";
import { MdCallEnd } from "react-icons/md";
import { BiSolidPhoneCall } from "react-icons/bi";

function Room() {
	const { socket, peer, getOffer, getAnswer, setRemoteAnswer } =
		useContext(UserContext);
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
	const [callAccept, setCallAccept] = useState(null);

	async function handleIncomingCall({ from, offer }) {
		console.log("Incoming Call from ->", from, " and offer is -> ", offer);
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true,
		});
		setMyStream(stream);
		setRemoteSocketId(from);
		const ans = await getAnswer(offer);
		socket.emit("call:accepted", { to: from, ans });
	}

	async function handleCallAccepted({ from, ans }) {
		console.log("Call Accepted -> ", from, "and answer->", ans);
		await setRemoteAnswer(ans);
		sendStreams();
	}

	async function handleNegotiationIncoming({ from, offer }) {
		const ans = await getAnswer(offer);
		socket.emit("peer:nego:done", { to: from, ans });
	}

	async function handleNegotiationFinal({ from, ans }) {
		console.log("Negotiation Final");
		await setRemoteAnswer(ans);
	}
	function handleCancelVideoCall({ from }) {
		setMyStream(null);
		setRemoteStream(null);
		setAudioCall(false);
		setVideoCall(false);
		navigate("/");
		window.location.reload();
	}
	function handleNewUserJoined({ emailId, id }) {
		console.log("Room mei-> new user joined room", emailId, "s-id-> ", id);
		setRemoteSocketId(id);
	}
	//audio call button click
	const handleAudioCallUser = async () => {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
		});
		const offer = await getOffer();
		socket.emit("user:call", { to: remoteSocketId, offer });
		setMyStream(stream);
	};
	//video call button click
	const handleVideoCallUser = async () => {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true,
		});
		const offer = await getOffer();
		socket.emit("user:call", { to: remoteSocketId, offer });
		setMyStream(stream);
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
		const offer = await getOffer();
		socket.emit("peer:nego:needed", {
			to: remoteSocketId,
			offer,
		});
	}

	useEffect(() => {
		peer.addEventListener("negotiationneeded", handleNegotiation);
		return () => {
			peer.removeEventListener("negotiationneeded", handleNegotiation);
		};
	}, [handleNegotiation, peer]);

	const sendStreams = () => {
		for (const track of myStream.getTracks()) {
			peer.addTrack(track, myStream);
		}
		setCallAccept(true);
	};

	const handleTrackEvent = async (ev) => {
		const remoteStream = ev.streams;
		console.log("GOT TRACKS!!");
		setRemoteStream(remoteStream[0]);
	};

	useEffect(() => {
		peer.addEventListener("track", handleTrackEvent);
		return () => {
			peer.removeEventListener("track", handleTrackEvent);
		};
	}, [handleTrackEvent, peer]);

	const navigate = useNavigate();

	const cancelVideoCall = () => {
		setMyStream(null);
		setRemoteStream(null);
		setAudioCall(false);
		setVideoCall(false);
		navigate("/");
		socket.emit("cancel:videoCall", { to: remoteSocketId });
		window.location.reload();
	};

	return (
		<div className="bg-doodle-pattern bg-contain w-screen h-screen flex flex-col items-center">
			<h4 className="mt-1 text-xs opacity-5">
				{remoteSocketId ? "Connected" : "Not Connected"}
			</h4>
			{!remoteStream && (
				<div className="w-[30%] max-w-[100px] h-[50px] bg-blue-900 shadow-md rounded-lg border text-white flex items-center justify-center">
					{(audioCall || videoCall) && !remoteStream && (
						<div className=" text-md animate-pulse">Calling...</div>
					)}
				</div>
			)}

			<div className="mt-1 mb-2 h-full bg-pink-30 flex flex-col md:flex-row flex-wrap items-center justify-center gap-1">
				<div className="drop-shadow-md">
					{myStream && (
						<>
							{/* <p>My Stream</p> */}
							<ReactPlayer
								// className="react-player"
								width={"100%"}
								height={"100%"}
								url={myStream}
								playing
								// muted
							/>
						</>
					)}
				</div>
				<div className="drop-shadow-md">
					{remoteStream && (
						<>
							{/* <p>Remote Stream</p> */}
							<ReactPlayer
								// className="react-player"
								width={"100%"}
								height={"100%"}
								url={remoteStream}
								playing
							/>
						</>
					)}
				</div>
				<div className="bg-pink-30 w-[100%] flex flex-col items-center justify-center">
					{remoteStream && (!audioCall || !videoCall) && !callAccept && (
						<p className="bg-blue-800/70 shadow-md px-5 py-2 rounded-md text-md text-white font-semibold text-center">
							Incoming call
							<span className="animate-pulse tracking-widest">...</span>
						</p>
					)}
					<div className="mt-8 flex items-center justify-around">
						{remoteStream && (!audioCall || !videoCall) && !callAccept && (
							<button
								className="bg-green-500 shadow-md text-white rounded-full p-2 animate-pulse"
								onClick={sendStreams}
							>
								<BiSolidPhoneCall className="text-3xl" />
							</button>
						)}
						{(remoteStream || audioCall || videoCall) && (
							<button
								className={`${
									audioCall || videoCall ? "mt-10" : "ml-10"
								} bg-red-500 shadow-md text-white rounded-full p-2`}
								onClick={cancelVideoCall}
							>
								<MdCallEnd className="text-2xl" />
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Room;

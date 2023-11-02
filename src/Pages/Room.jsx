import React, { useContext, useEffect, useState } from "react";
import { CallContext, UserContext } from "./UserContext";
import ReactPlayer from "react-player";
import { useNavigate } from "react-router-dom";

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
			handleVideoCallUser();
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
			<h4 className="mt-1 text-xs">
				{remoteSocketId ? "Connected" : "Not Connected"}
			</h4>
			{!remoteStream && (
				<div className="w-[50%] h-[100px] flex items-center justify-center">
					<div className="w-[60%] h-[50%] backdrop-blur-md rounded-lg border-2 text-gray-700 flex flex-col items-center justify-center gap-2">
						{videoCall && !remoteStream && (
							<div className=" text-sm animate-ping">Calling...</div>
						)}
					</div>
				</div>
			)}

			<div className="mt-1 mb-2 h-full bg-pink-30 flex flex-col md:flex-row flex-wrap items-center justify-center gap-1">
				<div className="">
					{myStream && (
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
					)}
				</div>
				<div className="">
					{remoteStream && (
						<>
							{/* <p>Remote Stream</p> */}
							<ReactPlayer
								width={"100%"}
								height={"100%"}
								url={remoteStream}
								playing
							/>
						</>
					)}
				</div>
				<div className="flex md:flex-col gap-5">
					{(!remoteStream && !videoCall) && (
						<p className="text-xl text-center">
							Incoming call
							<span className="animate-pulse tracking-widest">...</span>
						</p>
					)}
					<div className="flex items-center gap-8">
						{(!remoteStream && !videoCall) && (
							<button
								className="bg-green-500 text-white rounded-md px-3 py-1 animate-pulse"
								onClick={sendStreams}
							>
								Accept
							</button>
						)}
						{(remoteStream || videoCall) && (
							<button
								className={`${
									videoCall ? "mt-10" : "ml-10"
								} bg-red-500 text-white rounded-lg px-3 py-1`}
								onClick={cancelVideoCall}
							>
								Cancel
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Room;

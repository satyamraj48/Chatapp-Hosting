import React, { useContext, useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { GrAttachment } from "react-icons/gr";
import { CallContext, UserContext } from "./UserContext";
import { BsArrowDownShort, BsArrowLeft } from "react-icons/bs";
import { uniqBy } from "lodash";
import axios from "axios";
import { RiCheckDoubleFill } from "react-icons/ri";
import LogoAnimate from "./LogoAnimate";
import { useNavigate } from "react-router-dom";
import ShowFileModal from "../components/core/ChatModal/ShowFileModal";
import Sidebar from "../components/core/Sidebar";
import DetailsBar from "../components/core/DetailsBar";
import PreviewMediaModal from "../components/core/ChatModal/PreviewMediaModal";

function Chat() {
	const [onlinePeople, setOnlinePeople] = useState({});
	const [offlinePeople, setOfflinePeople] = useState([]);
	const [selectedUserId, setSelectedUserId] = useState(null);
	const [newMessageText, setNewMessageText] = useState("");
	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(false);
	const [loadingMsg, setLoadingMsg] = useState(false);
	const [isScroll, setIsScroll] = useState(false);
	const [showList, setShowList] = useState(true);
	const [messageSeenAt, setMessageSeenAt] = useState(null);
	const divUnderMessagesRef = useRef();

	const { id, username, setId, setUsername, socket } = useContext(UserContext);
	const { setAudioCall, setVideoCall, setRemoteSocketId } =
		useContext(CallContext);

	const [imageFile, setImageFile] = useState(null);
	const [previewSourceModal, setPreviewSourceModal] = useState(null);
	const [showFileModal, setShowFileModal] = useState(null);
	const navigate = useNavigate();

	function handleOnlineUsers({ onlinePeople }) {
		// console.log("->>>> ", onlinePeople);
		showOnlinePeople(onlinePeople);
	}
	function handleIncomingMessage(messageData) {
		// console.log("incoming msg--> ", messageData);
		if (messageData.sender === selectedUserId) {
			setMessages((prev) => [...prev, { ...messageData }]);
			// console.log("message set");
		}
	}
	function handleSeenAtMessage(messageData) {
		// console.log("seenAtMessage->>>> ", messageData);
		if (selectedUserId === messageData.dekha) {
			let date = new Date(messageData.seenAt);
			let time = date.getTime();
			// console.log("seenAt Recieved", time);
			setMessageSeenAt(time);
		}
	}
	function handleJoinRoom({ roomId, emailId, recipient }) {
		if (recipient) {
			console.log("3 sent video call to other");
			socket.emit("outgoing:videoCall", {
				sender: emailId,
				to: recipient,
				roomId,
			});
		}
		navigate(`/room/${roomId}`);
	}
	function handleIncomingVideoCall({ sender, roomId }) {
		const emailId = id + "@video.com";
		if (roomId && emailId && sender) {
			console.log("5 video call aya and called room join");
			socket.emit("room:join", { roomId, emailId });
		}
	}
	function handleNewUserJoined({ emailId, joinerId }) {
		console.log(
			"Chat mei-> new user joined room",
			emailId,
			"s-id-> ",
			joinerId
		);
		setRemoteSocketId(joinerId);
	}

	// handling all incoming socket requests
	useEffect(() => {
		socket.on("user:joined", handleNewUserJoined);
		socket.on("online:users", handleOnlineUsers);
		socket.on("incoming:message", handleIncomingMessage);
		socket.on("seenAt:message", handleSeenAtMessage);
		socket.on("room:join", handleJoinRoom);
		socket.on("incoming:videoCall", handleIncomingVideoCall);

		return () => {
			socket.off("user:joined", handleNewUserJoined);
			socket.off("online:users", handleOnlineUsers);
			socket.off("incoming:message", handleIncomingMessage);
			socket.off("seenAt:message", handleSeenAtMessage);
			socket.off("room:join", handleJoinRoom);
			socket.off("incoming:videoCall", handleIncomingVideoCall);
		};
	}, [
		handleNewUserJoined,
		handleIncomingVideoCall,
		handleJoinRoom,
		handleSeenAtMessage,
		handleIncomingMessage,
		handleOnlineUsers,
		socket,
	]);

	function handleVideoCall() {
		if (selectedUserId) {
			const roomId = selectedUserId + "|" + id;
			const emailId = id + "@video.com";
			if (roomId && emailId) {
				//do room join and send video call to selected userId
				console.log("1 call gya idhar se");
				socket.emit("room:join", {
					roomId,
					emailId,
					recipient: selectedUserId,
				});
				setVideoCall(true);
				setAudioCall(false);
			}
		}
	}
	function handleAudioCall() {
		if (selectedUserId) {
			const roomId = selectedUserId + "|" + id;
			const emailId = id + "@video.com";
			if (roomId && emailId) {
				//send video call to selected userId
				socket.emit("room:join", {
					roomId,
					emailId,
					recipient: selectedUserId,
				});
				setAudioCall(true);
				setVideoCall(false);
			}
		}
	}

	async function sendMessage(e) {
		if (e) e.preventDefault();
		// console.log("recipient--> ", selectedUserId, " - text--> ", newMessageText);

		setPreviewSourceModal(null);

		const sentAtTime = new Date();
		const fileId = Date.now();

		const formData = new FormData();
		formData.append("imageFile", imageFile);
		formData.append("sentAt", sentAtTime);
		formData.append("fileId", fileId);

		if (imageFile) {
			await axios.post("/auth/sendImage/" + selectedUserId, formData);
		}

		socket.emit("outgoing:message", {
			recipient: selectedUserId,
			text: newMessageText ? newMessageText : null,
			file: imageFile ? fileId : null,
			sentAt: sentAtTime,
		});

		if (!imageFile) {
			setMessages((prev) => [
				...prev,
				{
					text: newMessageText,
					sender: id,
					recipient: selectedUserId,
					_id: Date.now(),
					sentAt: sentAtTime,
				},
			]);
		} else {
			await axios
				.get("/auth/messages/" + selectedUserId)
				.then((res) => setMessages(res.data.data));
		}
		setNewMessageText("");
		setImageFile(null);
	}

	function showOnlinePeople(peopleArray) {
		// console.log(peopleArray);
		const people = {};
		peopleArray.forEach(({ userId, username }) => {
			if (userId !== id) {
				people[userId] = username;
			}
		});
		// console.log("online people-> ", people);
		setOnlinePeople(people);
	}

	function handleLogout() {
		axios.post("/auth/logout").then(() => {
			setId(null);
			setUsername(null);
		});
	}

	function handleFileChange(e) {
		const file = e.target.files[0];
		if (file) {
			// console.log("imageFile--> ", file);
			setImageFile(file);
			previewFile(file);
			e.target.value = null;
		}
	}

	function previewFile(file) {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onloadend = () => {
			setPreviewSourceModal(reader.result);
			// console.log("reader result--> ", reader.result);
		};
	}

	function isInViewport(element) {
		if (element) {
			const rect = element.getBoundingClientRect();
			return (
				rect.top >= 0 &&
				rect.left >= 0 &&
				rect.bottom <=
					(window.innerHeight || document.documentElement.clientHeight) &&
				rect.right <=
					(window.innerWidth || document.documentElement.clientWidth)
			);
		} else return false;
	}

	//remove duplicate messages
	const messagesWithoutDupes = uniqBy(messages, "_id");

	//agr ptachala user ka message is user k viewport mei h,
	// to ptachala ko bta do is user ka seen time.
	function sendSeenToPtachala() {
		const box = document.querySelector(".seenBox");
		const isInViewportBox = isInViewport(box);
		// console.log("isinViewport->  ", isInViewportBox);
		// console.log("viewport selected->  ", selectedUserId);
		if (selectedUserId) {
			socket.emit("seen:message", {
				ptachala: selectedUserId,
				seenAt: new Date(),
			});
		}
	}

	//scroll when message received or sent and send message seen to ptachala
	useEffect(() => {
		if (selectedUserId) {
			goToBottom();
			sendSeenToPtachala();
		}
	}, [messages]);

	// api call to get user messages
	useEffect(() => {
		const getUserMessages = async () => {
			if (selectedUserId) {
				// setLoading(true);
				// console.log("selected in api-> ", selectedUserId);
				const messagesResponse = await axios.get(
					"/auth/messages/" + selectedUserId
				);
				if (messagesResponse.data.success) {
					setMessages(messagesResponse.data.data);
				}

				const messageSeenResponse = await axios.get(
					"/auth/messageseen/" + selectedUserId
				);
				if (messageSeenResponse.data.success) {
					setMessageSeenAt(
						new Date(messageSeenResponse.data.data?.seenAt).getTime()
					);
				}
				goToBottom();
				// console.log("res-> ", res.data.data);
				// setLoading(false);
			}
		};
		getUserMessages();
	}, [selectedUserId]);

	//api call to set offline people
	useEffect(() => {
		axios.get("/auth/people").then((res) => {
			const offlinePeopleArr = res.data.data
				.filter((p) => p._id !== id)
				.filter((p) => !Object.keys(onlinePeople).includes(p._id));

			const offlinePeople = {};
			offlinePeopleArr.forEach((p) => (offlinePeople[p._id] = p));

			// console.log("offlinePeople-> ", offlinePeople);

			setOfflinePeople(offlinePeople);
		});
	}, [onlinePeople]);

	//scroll to bottom of messages
	function goToBottom() {
		const div = divUnderMessagesRef.current;
		if (div) {
			div.scrollIntoView({ behavior: "instant", block: "end" });
		}
	}

	//window width
	const getWindowSize = () => {
		const pageWidth = window.matchMedia("(min-width: 768px)");
		if (pageWidth.matches) {
			setShowList(true);
		}
		const pageWidth2 = window.matchMedia("(max-width: 767px)");
		if (pageWidth2.matches && selectedUserId) {
			setShowList(false);
		}
	};
	window.addEventListener("resize", getWindowSize);

	let val;
	//date of message
	function getDateOfMessage(sentAt) {
		val = new Date(sentAt).toLocaleString("en-IN", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});

		let date = new Date().getDate() - new Date(sentAt).getDate();
		let month = new Date().getMonth() - new Date(sentAt).getMonth();
		let year = new Date().getYear() - new Date(sentAt).getYear();

		if (date === 0 && month === 0 && year === 0) return "Today";
		else if (date === 1 && month === 0 && year === 0) return "Yesterday";
		else {
			let date = new Date(sentAt).toLocaleString("en-IN", {
				day: "numeric",
				month: "long",
				year: "numeric",
			});
			return date;
		}
	}
	function currentMessageDate(sentAt) {
		return new Date(sentAt).toLocaleString("en-IN", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	}

	//check message seen or not
	function checkIsSeen(sentAt, index) {
		const flag = messageSeenAt >= new Date(sentAt).getTime() ? true : false;
		return flag;
	}

	return (
		<div className="relative h-screen flex tracking-wide font-Poppins">
			<LogoAnimate />

			{/* Left Sidebar */}
			<Sidebar
				showList={showList}
				setShowList={setShowList}
				onlinePeople={onlinePeople}
				offlinePeople={offlinePeople}
				selectedUserId={selectedUserId}
				setSelectedUserId={setSelectedUserId}
				username={username}
				handleLogout={handleLogout}
			/>

			{/* selected user message section */}
			<div
				className="relative w-full md:w-[calc(100%-330px)] bg-doodle-pattern bg-contain"
				onClick={() => setIsScroll(!isScroll)}
			>
				{/* details of selected user at top */}
				<DetailsBar
					showList={showList}
					setShowList={setShowList}
					onlinePeople={onlinePeople}
					offlinePeople={offlinePeople}
					selectedUserId={selectedUserId}
					setSelectedUserId={setSelectedUserId}
					username={username}
					handleAudioCall={handleAudioCall}
					handleVideoCall={handleVideoCall}
				/>
				<div className="h-full px-2 flex-grow">
					{!selectedUserId && (
						<div className="h-full flex flex-col gap-2 items-center justify-center">
							<div className="text-gray-300">No selected person</div>
							<div className="flex items-center gap-2 text-gray-400">
								<BsArrowLeft />
								Select a person from the sidebar
							</div>
						</div>
					)}
					{!!selectedUserId && (
						<>
							{loading ? (
								<div className="h-full grid place-content-center">
									<div className="spinner2"></div>
								</div>
							) : (
								<div className="relative h-[calc(100vh-4rem)] bg-yellow-20">
									<div className="absolute inset-0 px-2 space-y-1 h-full overflow-y-scroll overflow-x-hidden bg-yellow-30">
										<div className="w-full h-[40px]"></div>
										{messagesWithoutDupes.map((message, index) => (
											<div
												key={index}
												className={`${
													message.sender === id ? "text-right" : "text-left"
												}`}
											>
												<div className="grid place-content-center">
													<p
														className={`my-8 px-2 py-[2px] bg-white rounded-lg text-gray-900 text-sm shadow-md shadow-black/10 ${
															val != currentMessageDate(message?.sentAt)
																? "block"
																: "hidden"
														}`}
													>
														{getDateOfMessage(message?.sentAt)}
													</p>
												</div>

												<div
													className={`seenBox relative inline-block max-w-[70%] shadow-black/10 ${
														message.file
															? "bg-transparent"
															: message.sender === id
															? "bg-blue-600 text-white shadow-md drop-shadow-lg rounded-tr-[4px]"
															: "bg-white text-black shadow-md drop-shadow-lg rounded-tl-[4px]"
													} text-sm text-left rounded-2xl space-y-1 pb-[2px]`}
												>
													{/* triangle div */}
													{!message.file && false && (
														<div
															className={`absolute z-[10] ${
																message.sender === id
																	? "-right-1 rotate-180 text-blue-600"
																	: "-left-1 -rotate-90 text-white"
															} w-3 h-3`}
														>
															<div
																className={`w-0 h-0 border-l-[10px] border-l-transparent border-r-[1px]  border-b-[10px] rounded-sm ${
																	message.sender === id
																		? "border-r-blue-600 border-b-blue-600"
																		: "border-r-white border-b-white"
																}`}
															></div>
														</div>
													)}
													{loadingMsg &&
													index === messagesWithoutDupes.length - 1 ? (
														<div className="animate-pulse text-white tracking-wide px-5 py-2">
															Sending...
														</div>
													) : (
														<div className="mx-2 mt-1">
															{message.text && (
																<span
																	className={`${
																		message?.text?.length > 30 && "break-words"
																	}`}
																>
																	{message.text}
																</span>
															)}

															{message?.file && (
																<div>
																	{message.file.includes("/image/") ? (
																		<img
																			src={message.file}
																			className="h-60 object-contain rounded-lg drop-shadow-md cursor-pointer"
																			onClick={() =>
																				setShowFileModal(message.file)
																			}
																		/>
																	) : (
																		<video
																			src={message.file}
																			playsInline={true}
																			className="w-80 object-contain rounded-lg drop-shadow-md cursor-pointer"
																			onClick={() =>
																				setShowFileModal(message.file)
																			}
																		></video>
																	)}
																</div>
															)}
															{/* date and seen(tick) */}
															<p
																className={`ml-2 ${
																	message?.text?.length > 30 || message?.file
																		? "mt-1 flex"
																		: "inline-flex"
																} items-center justify-end gap-[2px] text-[10px] ${
																	message.file
																		? "text-black"
																		: message.sender === id
																		? "text-blue-200"
																		: "text-gray-600"
																}`}
																onClick={() => console.log(previewSourceModal)}
															>
																{new Date(message?.sentAt).toLocaleString(
																	"en-IN",
																	{
																		hour: "numeric",
																		minute: "numeric",
																	}
																)}

																<span
																	className={`text-[14px] ${
																		message.sender !== id && "hidden"
																	} ${
																		checkIsSeen(message?.sentAt, index)
																			? message.file
																				? "text-blue-500"
																				: "text-white"
																			: "text-gray-400"
																	} `}
																>
																	<RiCheckDoubleFill className="text-xs" />
																</span>
															</p>
														</div>
													)}
												</div>
											</div>
										))}

										<div ref={divUnderMessagesRef}></div>
									</div>
								</div>
							)}
						</>
					)}
				</div>
				{/* input message box, file attach, send button */}
				{!!selectedUserId && (
					<>
						<button
							className={`${
								isScroll ? "hidden" : "hidden"
							} absolute bottom-20 right-10 grid place-content-center bg-gray-100 rounded-full p-1 shadow-md shadow-gray-400 border border-gray-400 z-[200]`}
							onClick={goToBottom}
						>
							<BsArrowDownShort className="text-2xl text-gray-500" />
						</button>

						<form
							onSubmit={sendMessage}
							className="bg-green-40 fixed bottom-0 z-[120] w-full md:w-[calc(100%-330px)] px-3 pb-4 flex items-center gap-2"
						>
							<input
								type="text"
								value={newMessageText}
								onChange={(e) => setNewMessageText(e.target.value)}
								disabled={!!!selectedUserId}
								placeholder="Type your message here"
								className="px-3 py-2 w-[80%] md:w-full flex-1 bg-white rounded-full md:rounded-lg border border-blue-400 outline-none focus:border-blue-600 tracking-wide text-gray-900 drop-shadow-md placeholder:text-gray-300 placeholder:text-sm"
							/>
							<label className="p-2 bg-blue-200 rounded-full text-gray-600 border border-blue-200 cursor-pointer drop-shadow-md shadow-sm">
								<input
									type="file"
									onChange={handleFileChange}
									className="hidden"
									accept="image/png, image/jpg, image/jpeg, video/mp4"
								/>
								<GrAttachment />
							</label>
							<button
								type="submit"
								disabled={!!!newMessageText}
								className={`bg-blue-600 rounded-full text-white drop-shadow-md shadow-lg p-3`}
							>
								<IoSend className="text-md" />
							</button>
						</form>
					</>
				)}
			</div>

			{/* modal for previewing media that is to be sent */}
			{previewSourceModal && (
				<PreviewMediaModal
					previewSourceModal={previewSourceModal}
					setPreviewSourceModal={setPreviewSourceModal}
					imageFile={imageFile}
					setImageFile={setImageFile}
					sendMessage={sendMessage}
				/>
			)}

			{/* modal for showing media that is sent or recieved */}
			{showFileModal && (
				<ShowFileModal
					showFileModal={showFileModal}
					setShowFileModal={setShowFileModal}
				/>
			)}
		</div>
	);
}

export default Chat;

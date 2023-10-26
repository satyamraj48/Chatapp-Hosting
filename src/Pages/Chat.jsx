import React, { useContext, useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { GrAttachment } from "react-icons/gr";
import Logo from "../components/core/ChatContacts/Logo";
import { UserContext } from "./UserContext";
import { BsArrowDownShort, BsArrowLeft } from "react-icons/bs";
import { uniqBy } from "lodash";
import axios from "axios";
import toast from "react-hot-toast";
import Contact from "./Contact";
import { HiUser } from "react-icons/hi2";
import { RxCross2 } from "react-icons/rx";
import { RiCheckDoubleFill } from "react-icons/ri";
import { IoMdArrowBack } from "react-icons/io";
import { LuTriangleRight } from "react-icons/lu";
import LogoAnimate from "./LogoAnimate";

function Chat() {
	const [ws, setWs] = useState(null);
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

	const divUnderMessages = useRef();

	const { id, username, setId, setUsername } = useContext(UserContext);

	useEffect(() => {
		connectToWs();
	}, []);

	//to be understand
	useEffect(() => {
		ws?.addEventListener("message", handleMessage);
		return () => ws?.removeEventListener("message", handleMessage);
	}, [selectedUserId]);

	function handleMessage(event) {
		const messageData = JSON.parse(event.data);
		// console.log("selected-> ", selectedUserId);
		// if (!("online" in messageData)) console.log("messageData-> ", messageData);

		if ("online" in messageData) {
			showOnlinePeople(messageData.online);
		} else if ("text" in messageData) {
			// console.log("select - ", selectedUserId);
			if (messageData.sender === selectedUserId) {
				// console.log("message set");
				setMessages((prev) => [...prev, { ...messageData }]);
			}
		} else if ("seenAt" in messageData) {
			// console.log(selectedUserId, " ____ ", messageData.dekha);
			if (selectedUserId === messageData.dekha) {
				let date = new Date(messageData.seenAt);
				let time = date.getTime();
				// console.log("seenAt Recieved", time);
				setMessageSeenAt(time);
			}
		}
	}
	function connectToWs() {
		const toastId = toast.loading("Connecting...");
		const ws = new WebSocket(
			`${1 ? "wss" : "ws"}://${import.meta.env.VITE_REACT_APP_WS_URL}`
		);
		setWs(ws);
		// ws.addEventListener("message", handleMessage);
		ws.addEventListener("close", () => {
			setTimeout(() => {
				console.log("Disconnected. Trying to reconnect...");
				connectToWs();
			}, 1000);
		});
		console.log("Now Connected!");
		toast.dismiss(toastId);
	}

	function sendMessage(e, file = null) {
		if (e) e.preventDefault();
		// setLoadingMsg(true);
		ws.send(
			JSON.stringify({
				recipient: selectedUserId,
				text: newMessageText,
				file: file,
				sentAt: new Date(),
			})
		);

		if (!file) {
			setMessages((prev) => [
				...prev,
				{
					text: newMessageText,
					sender: id,
					recipient: selectedUserId,
					_id: Date.now(),
					sentAt: new Date(),
				},
			]);
		} else {
			axios
				.get("/auth/messages/" + selectedUserId)
				.then((res) => setMessages(res.data.data));
		}
		setNewMessageText("");
		// setLoadingMsg(false);
	}

	function showOnlinePeople(peopleArray) {
		// console.log(peopleArray);
		const people = {};
		peopleArray.forEach(({ userId, username }) => {
			if (userId !== id) people[userId] = username;
		});
		// console.log("online people-> ", people);
		setOnlinePeople(people);
	}

	function handleLogout() {
		axios.post("/auth/logout").then(() => {
			setWs(null);
			setId(null);
			setUsername(null);
		});
	}

	function handleSendFile(e) {
		const reader = new FileReader();
		reader.readAsDataURL(e.target.files[0]);
		reader.onload = () => {
			const file = reader.result;
			sendMessage(null, { info: e.target.files[0].name, data: file });
		};
		// console.log(e.target.files[0]);
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

	const messagesWithoutDupes = uniqBy(messages, "_id");

	//agr ptachala user ka message is user k viewport mei h,
	// to ptachala ko bta do is user ka seen time.
	function sendSeenToPtachala() {
		if (selectedUserId) {
			const box = document.querySelector(".seenBox");
			const isInViewportBox = isInViewport(box);
			// console.log("isinViewport->  ", isInViewportBox);
			// console.log("viewport selected->  ", selectedUserId);
			if (isInViewportBox && selectedUserId) {
				ws.send(
					JSON.stringify({
						ptachala: selectedUserId,
						seenAt: new Date(),
					})
				);
			}
		}
	}

	//scroll when message received or sent
	useEffect(() => {
		goToBottom();
		sendSeenToPtachala();
	}, [messages]);

	// api call to get user messages
	useEffect(() => {
		const getUserMessages = async () => {
			if (selectedUserId) {
				// setLoading(true);
				// console.log("selected in api-> ", selectedUserId);
				const response = await axios.get("/auth/messages/" + selectedUserId);
				if (response.data.success) setMessages(response.data.data);

				const res = await axios.get("/auth/messageseen/" + selectedUserId);
				if (res.data.success)
					setMessageSeenAt(new Date(res.data.data?.seenAt).getTime());
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
		const div = divUnderMessages.current;
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

	//date of message
	let val;
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
		const val = messageSeenAt >= new Date(sentAt).getTime() ? true : false;
		// if (index === messagesWithoutDupes.length - 1) {
		// 	console.log(messageSeenAt, "--", new Date(sentAt).getTime(), "->", val);
		// }
		return val;
	}

	return (
		<div
			className="relative h-screen flex tracking-wide font-Poppins"
			// onScroll={() => setIsScroll(true)}
		>
			<LogoAnimate />

			<button
				className={`absolute left-[54%] top-4 ${
					!showList && "hidden"
				} md:hidden z-[260] text-2xl active:scale-90`}
				onClick={() => setShowList(false)}
			>
				<RxCross2 className="text-blue-300 hover:bg-blue-600 hover:rounded-full" />
			</button>
			<div
				className={`pt-6 absolute md:static z-[250] h-screen w-[60%] md:w-[330px] flex flex-col bg-transparent backdrop-blur-md shadow-[0px_-10px_10px_0px] shadow-black/10 ${
					showList
						? "translate-x-0 opacity-100"
						: "translate-x-[-100%] opacity-0"
				} transition-all duration-500`}
			>
				{/* logo and contacts */}
				<div className="flex-grow">
					{/* <div></div> */}
					<Logo />
					{/* contacts list */}
					<div className="space-y-0">
						{Object.keys(onlinePeople).map((userId) => (
							<Contact
								key={userId}
								id={userId}
								online={true}
								username={onlinePeople[userId]}
								onClick={() => {
									setSelectedUserId(userId);
									// console.log("userId: ", userId);
								}}
								selected={userId === selectedUserId}
								setShowList={setShowList}
							/>
						))}
						{Object.keys(offlinePeople).map((userId) => (
							<Contact
								key={userId}
								id={userId}
								online={false}
								username={offlinePeople[userId].username}
								onClick={() => {
									setSelectedUserId(userId);
									// console.log("Offline userId: ", userId);
								}}
								selected={userId === selectedUserId}
								setShowList={setShowList}
							/>
						))}
					</div>
				</div>

				{/* logout button */}
				<div className="p-2 mx-3 flex items-center justify-between text-center">
					<span className="flex items-center text-sm text-gray-600">
						<HiUser className="text-2xl" />
						{username}
					</span>
					<button
						className="px-4 py-1 bg-blue-100 rounded-sm border border-blue-300 text-gray-400"
						onClick={handleLogout}
					>
						logout
					</button>
				</div>
			</div>

			{/* selected user message section */}
			<div
				className="relative w-full md:w-[calc(100%-330px)] bg-doodle-pattern bg-contain"
				onClick={() => setIsScroll(!isScroll)}
			>
				<div className="absolute z-[200] top-0 w-full h-[60px] pl-2 flex items-center gap-1 bg-blue-700 text-white">
					<button
						className="ml-2 md:hidden"
						onClick={() => setShowList(!showList)}
					>
						<IoMdArrowBack className="text-[16px]" />
					</button>
					<div className="flex flex-col items-start">
						<p
							className={`text-xl capitalize ${
								selectedUserId ? "opacity-100" : "opacity-0"
							} transition-all duration-200`}
						>
							{onlinePeople[selectedUserId] ??
								offlinePeople[selectedUserId]?.username}
						</p>
						<span
							className={`ml-1 text-xs ${
								selectedUserId ? "opacity-100" : "opacity-0"
							} transition-all duration-700`}
						>
							{selectedUserId &&
								(onlinePeople[selectedUserId] ? "online" : "offline")}
						</span>
					</div>
				</div>
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
								<div className="relative h-[calc(100vh-4rem)] ">
									<div className="absolute inset-0 px-2 space-y-2 overflow-y-scroll overflow-x-hidden">
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
													className={`seenBox relative inline-block max-w-[70%] shadow-md shadow-black/10 ${
														message.sender === id
															? "bg-blue-500 text-white"
															: "bg-white text-black"
													} ${
														loadingMsg &&
														index === messagesWithoutDupes.length - 1 &&
														"bg-gray-400"
													} text-sm text-left rounded-md space-y-`}
												>
													<div
														className={`absolute z-[10] ${
															message.sender === id
																? "-right-2 rotate-180 text-blue-500"
																: "-left-2 -rotate-90 text-white"
														} w-3 h-3`}
													>
														<LuTriangleRight />
													</div>
													{loadingMsg &&
													index === messagesWithoutDupes.length - 1 ? (
														<div className="animate-pulse text-white tracking-wide px-5 py-2">
															Sending...
														</div>
													) : (
														<div className="mx-2 mt-1">
															<span
																className={`${
																	message.text.length > 30 && "break-words"
																}`}
															>
																{message.text}
															</span>
															{message.file && (
																<div>
																	<a
																		target="_blank"
																		href={
																			"http://localhost:4000/uploads/" +
																			message.file
																		}
																		className="flex items-center gap-1 hover:text-red-500 underline"
																	>
																		<GrAttachment />
																		{message.file}
																	</a>
																</div>
															)}
															{/* date and seen(tick) */}
															<p
																className={`ml-2 ${
																	message.text.length > 30
																		? "flex"
																		: "inline-flex"
																} items-center justify-end gap-[2px] text-[10px] ${
																	message.sender === id
																		? "text-blue-200"
																		: "text-gray-600"
																}`}
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
																			? "text-white"
																			: "text-gray-400"
																	} `}
																>
																	<RiCheckDoubleFill />
																</span>
															</p>
														</div>
													)}
												</div>
											</div>
										))}
										<div ref={divUnderMessages}></div>
									</div>
								</div>
							)}
						</>
					)}
				</div>
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
							className="bg-pink-40 fixed bottom-0 z-[120] w-full md:w-[calc(100%-330px)] px-3 pb-4 flex items-center gap-2"
						>
							<input
								type="text"
								value={newMessageText}
								onChange={(e) => setNewMessageText(e.target.value)}
								disabled={!!!selectedUserId}
								placeholder="Type your message here"
								className="px-3 py-2 w-[80%] md:w-full flex-1 bg-white rounded-full md:rounded border border-blue-300 outline-none focus:border-blue-600 tracking-wide text-gray-900 drop-shadow-md"
							/>
							<label className="p-2 bg-blue-200 rounded-full text-gray-600 border border-blue-200 cursor-pointer drop-shadow-md shadow-sm">
								<input
									type="file"
									onChange={handleSendFile}
									className="hidden"
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
		</div>
	);
}

export default Chat;

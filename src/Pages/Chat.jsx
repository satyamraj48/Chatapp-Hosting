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
import LogoAnimate from "./LogoAnimate";
import useOnClickOutside from "../hooks/useOnClickOutside.js";

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

	const divUnderMessages = useRef();

	const { id, username, setId, setUsername } = useContext(UserContext);

	useEffect(() => {
		connectToWs();
	}, []);

	function connectToWs() {
		const toastId = toast.loading("Connecting...");
		const ws = new WebSocket(
			`${1 ? "wss" : "ws"}://${import.meta.env.VITE_REACT_APP_WS_URL}`
		);
		setWs(ws);
		ws.addEventListener("message", handleMessage);
		ws.addEventListener("close", () => {
			setTimeout(() => {
				console.log("Disconnected. Trying to reconnect...");
				connectToWs();
			}, 1000);
		});
		console.log("Now Connected!");
		toast.dismiss(toastId);
	}

	function handleMessage(event) {
		const messageData = JSON.parse(event.data);
		// console.log("messageData-> ", messageData);
		if ("online" in messageData) {
			showOnlinePeople(messageData.online);
		} else if ("text" in messageData) {
			if (messageData.sender === selectedUserId) {
				setMessages((prev) => [...prev, { ...messageData }]);
			}
		}
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

	useEffect(() => {
		goToBottom();
		// console.log("id-> ", id);
		// console.log("msg-> ", messages);
	}, [messages]);

	useEffect(() => {
		const getUserMessages = async () => {
			if (selectedUserId) {
				// setLoading(true);
				const response = await axios.get("/auth/messages/" + selectedUserId);
				if (response.data.success) setMessages(response.data.data);
				// setLoading(false);
			}
		};
		getUserMessages();
	}, [selectedUserId]);

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

	const messagesWithoutDupes = uniqBy(messages, "_id");

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
	const clickOutsideRef = useRef();
	useOnClickOutside(clickOutsideRef, () => setShowList(false));

	return (
		<div
			className="relative h-screen flex tracking-wide font-Poppins"
			// onScroll={() => setIsScroll(true)}
		>
			<LogoAnimate />

			<button
				className={`absolute left-[54%] top-3 ${
					!showList && "hidden"
				} md:hidden z-[200] text-2xl active:scale-95`}
				onClick={() => setShowList(!showList)}
			>
				<RxCross2 className="text-blue-300 hover:bg-blue-600 hover:rounded-full" />
			</button>
			<div
				className={`pt-6 absolute md:static z-[40] h-screen min-w-[60%] md:min-w-[270px] flex flex-col bg-transparent backdrop-blur-md shadow-[0px_-10px_10px_0px] shadow-black/10 ${
					showList
						? "translate-x-0 opacity-100"
						: "translate-x-[-100%] opacity-0"
				} transition-all duration-500`}
				// ref={clickOutsideRef}
			>
				{/* logo and contacts */}
				<div className="flex-grow">
					<Logo />
					{/* contacts list */}
					<div className="space-y-0">
						{Object.keys(onlinePeople)?.map((userId) => (
							<Contact
								key={userId}
								userId={userId}
								online={true}
								selected={userId === selectedUserId}
								onClick={() => setSelectedUserId(userId)}
								username={onlinePeople[userId]}
								setShowList={setShowList}
							/>
						))}
						{Object.keys(offlinePeople)?.map((userId) => (
							<Contact
								key={userId}
								userId={userId}
								online={false}
								selected={userId === selectedUserId}
								onClick={(id) => setSelectedUserId(id)}
								username={offlinePeople[userId].username}
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
				className="relative w-full flex flex-col bg-doodle-pattern bg-contain"
				onClick={() => setIsScroll(!isScroll)}
			>
				<div className="w-full h-[60px] pl-2 flex items-center gap-1 bg-blue-700 text-white">
					<button
						className="ml-2 md:hidden"
						onClick={() => setShowList(!showList)}
					>
						<IoMdArrowBack className="text-[16px]" />
					</button>
					<p className="text-xl capitalize">{username}</p>
				</div>
				<div className="mx-4 flex-grow">
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
									<div className=" spinner2"></div>
								</div>
							) : (
								<div className="relative h-full">
									<div className="absolute inset-0 pr-1 space-y-2 overflow-y-scroll overflow-x-hidden">
										<div className="w-full h-[30px]"></div>
										{messagesWithoutDupes.map((message, index) => (
											<div
												key={index}
												className={`${
													message.sender === id ? "text-right" : "text-left"
												}`}
											>
												<div className="grid place-content-center">
													<p
														className={`my-10 px-2 py-[2px] bg-white rounded-lg text-gray-900 text-sm shadow-md shadow-black/10 ${
															val != currentMessageDate(message?.sentAt)
																? "block"
																: "hidden"
														}`}
													>
														{getDateOfMessage(message?.sentAt)}
													</p>
												</div>

												<div
													className={`inline-block max-w-[70%] shadow-md shadow-black/10 ${
														message.sender === id
															? "bg-blue-500 text-white"
															: "bg-white text-black"
													} ${
														loadingMsg &&
														index === messagesWithoutDupes.length - 1 &&
														"bg-gray-400"
													} text-sm text-left rounded-md space-y-`}
												>
													<div className="bg-red-600 w- h-"></div>
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

																{true && (
																	<span
																		className={`text-[14px] ${
																			message.sender === id ? "" : "hidden"
																		} ${true && "text-yellow-200"}`}
																	>
																		<RiCheckDoubleFill />
																	</span>
																)}
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
								isScroll ? "grid" : "hidden"
							} absolute bottom-20 right-10 grid place-content-center bg-gray-100 rounded-full p-1 shadow-md shadow-gray-400 border border-gray-400 z-[200]`}
							onClick={goToBottom}
						>
							<BsArrowDownShort className="text-2xl text-gray-500" />
						</button>

						<form
							onSubmit={sendMessage}
							className="mx-4 mb-4 max-w-full flex items-center gap-2"
						>
							<input
								type="text"
								value={newMessageText}
								onChange={(e) => setNewMessageText(e.target.value)}
								disabled={!!!selectedUserId}
								placeholder="Type your message here"
								className="p-2 pl-3 w-full flex-gro bg-white rounded-full md:rounded border border-blue-300 outline-none focus:border-blue-600 tracking-wide text-gray-900 drop-shadow-md"
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

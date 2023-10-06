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
import { AiOutlineMenu } from "react-icons/ai";

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
		const ws = new WebSocket(`wss://${import.meta.env.VITE_REACT_APP_WS_URL}`);
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

	function showOnlinePeople(peopleArray) {
		// console.log(peopleArray);
		const people = {};
		peopleArray.forEach(({ userId, username }) => {
			if (userId !== id) people[userId] = username;
		});
		// console.log("online people-> ", people);
		setOnlinePeople(people);
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
			})
		);

		if (file) {
			axios
				.get("/auth/messages/" + selectedUserId)
				.then((res) => setMessages(res.data.data));
		} else {
			setMessages((prev) => [
				...prev,
				{
					text: newMessageText,
					sender: id,
					recipient: selectedUserId,
					_id: Date.now(),
				},
			]);
		}
		setNewMessageText("");
		// setLoadingMsg(false);
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
			div.scrollIntoView({ behavior: "smooth", block: "end" });
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

	return (
		<div
			className="relative h-screen flex tracking-wide font-Poppins"
			// onScroll={() => setIsScroll(true)}
		>
			<button
				className="absolute md:hidden top-1 left-4 z-[50] text-2xl hover:bg-blue-50 active:bg-blue-100"
				onClick={() => setShowList(!showList)}
			>
				<AiOutlineMenu className="text-blue-700" />
			</button>
			<div
				className={`pt-6 absolute md:static z-[40] h-screen min-w-[250px] flex flex-col bg-blue-50 ${
					showList
						? "translate-x-0 opacity-100"
						: "translate-x-[-100%] opacity-0"
				} transition-all duration-1000`}
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
				className="relative mr-2 p-4 w-full max-w-[800px] flex flex-col bg-blue-100"
				onClick={() => setIsScroll(!isScroll)}
			>
				<div className="flex-grow">
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
									<div className="absolute top-0 left-0 right-0 bottom-0 pr-1 space-y-2 overflow-y-scroll overflow-x-hidden">
										{messagesWithoutDupes.map((message, index) => (
											<div
												key={index}
												className={`${
													message.sender === id ? "text-right" : "text-left"
												}`}
											>
												<div
													className={`inline-block px-5 py-2 ${
														message.sender === id
															? "bg-blue-400 text-white"
															: "bg-gray-100 text-gray-800"
													} ${
														loadingMsg &&
														index === messagesWithoutDupes.length - 1 &&
														"bg-gray-400"
													} text-sm text-left rounded-md`}
												>
													{loadingMsg &&
													index === messagesWithoutDupes.length - 1 ? (
														<div className="animate-pulse text-white tracking-wide">
															Sending...
														</div>
													) : (
														<div>
															{message.text}
															{message.file && (
																<div className="">
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
														</div>
													)}
												</div>
											</div>
										))}
										<div ref={divUnderMessages}></div>
									</div>
									<div className="relative h-2 bg-blue-100 shadow-[0_15px_20px_rgb(219,234,254)] z-[10]"></div>
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
						<div className="h-8 bg-blue-100 shadow-[0_-5px_20px_0px_rgb(219,234,254)] z-[10]"></div>
						<form onSubmit={sendMessage} className="flex items-center gap-2">
							<input
								type="text"
								value={newMessageText}
								onChange={(e) => setNewMessageText(e.target.value)}
								disabled={!!!selectedUserId}
								placeholder="Type your message here"
								className="p-2 flex-grow bg-white rounded border border-blue-300 outline-none focus:border-blue-600 tracking-wide text-gray-900"
							/>
							<label className="p-2 bg-blue-200 rounded-full text-gray-600 border border-blue-200 cursor-pointer">
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
								className={`bg-blue-500 rounded-full text-white text-2xl p-2`}
							>
								<IoSend />
							</button>
						</form>
					</>
				)}
			</div>
		</div>
	);
}

export default Chat;

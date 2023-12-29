import React from "react";
import { RxCross2 } from "react-icons/rx";
import Logo from "./ChatContacts/Logo";
import Contact from "../../Pages/Contact";
import { HiUser } from "react-icons/hi2";

function Sidebar({
	showList,
	setShowList,
	onlinePeople,
	offlinePeople,
	selectedUserId,
	setSelectedUserId,
	username,
	handleLogout,
}) {
	return (
		<div
			className={`pt-6 absolute md:static z-[250] h-screen w-[60%] max-w-[330px] flex flex-col bg-blue-50 backdrop-blur-md shadow-[0px_-10px_10px_0px] shadow-black/10 ${
				showList ? "translate-x-0 opacity-100" : "translate-x-[-100%] opacity-0"
			} transition-all duration-500`}
		>
			{/* logo and contacts */}
			<div className="flex-grow">
				{/* cross button on sidebar */}
				<div className="w-full flex items-center justify-end">
					<button
						className={`mr-3 ${
							!showList && "hidden"
						} md:hidden z-[260] active:scale-90`}
						onClick={() => setShowList(false)}
					>
						<RxCross2 className="text-2xl text-blue-500 bg-blue-100 drop-shadow-sm hover:bg-blue-200 hover:drop-shadow-md p-1 rounded-full transition-all duration-300" />
					</button>
				</div>

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
								// console.log("Online userId: ", userId);
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
			<div className="p-2 m-3 flex items-center justify-between text-center">
				<span className="flex items-center text-sm text-gray-600">
					<HiUser className="text-2xl" />
					{username}
				</span>
				<button
					className="px-4 py-1 bg-blue-100 rounded-md md:rounded border border-blue-300 text-gray-400"
					onClick={handleLogout}
				>
					logout
				</button>
			</div>
		</div>
	);
}

export default Sidebar;

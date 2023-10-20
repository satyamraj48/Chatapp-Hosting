import React from "react";
import Avatar from "../components/core/ChatContacts/Avatar";

function Contact({ userId, selected, onClick, username, online }) {
	return (
		<div
			className={`flex items-center gap-2 border-b border-b-gray-200 cursor-pointer ${
				selected && "bg-white shadow-sm"
			} 
    `}
			onClick={() => onClick(userId)}
		>
			{selected && <div className="w-1 h-14 bg-blue-600 rounded-r-md "></div>}

			<div className="px-4 py-2 flex items-center gap-3">
				<Avatar userId={userId} username={username} online={online} />
				<span className="text-gray-800 text-lg font-medium">{username}</span>
			</div>

		</div>
	);
}

export default Contact;

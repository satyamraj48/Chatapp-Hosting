import React, { useRef } from "react";
import Avatar from "../components/core/ChatContacts/Avatar";
import useOnClickOutside from "../hooks/useOnClickOutside";

function Contact({ id, selected, onClick, username, online, setShowList }) {
	const clickOutsideRef = useRef();
	useOnClickOutside(clickOutsideRef, () => setShowList(false));

	return (
		<div
			key={id}
			className={`flex items-center gap-2 border-b border-b-blue-100 ${
				selected ? "bg-white shadow-md" : "hover:bg-gray-200 drop-shadow-sm"
			} 
    `}
			onClick={() => onClick(id)}
			ref={clickOutsideRef}
		>
			{selected && <div className="w-1 h-14 bg-blue-600 rounded-r-md "></div>}

			<div className="px-4 py-2 flex items-center gap-3 select-none">
				<Avatar userId={id} username={username} online={online} />
				<span className="text-gray-800 text-lg font-medium">{username}</span>
			</div>
		</div>
	);
}

export default Contact;

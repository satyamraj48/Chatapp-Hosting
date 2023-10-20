import React from "react";
import { HiMiniChatBubbleLeftRight } from "react-icons/hi2";

function Logo() {
	return (
		<div className="p-4 pt-10 pb-6 flex items-center gap-2 text-blue-600 font-bold text-3xl">
			<HiMiniChatBubbleLeftRight />
			MernChat
		</div>
	);
}

export default Logo;

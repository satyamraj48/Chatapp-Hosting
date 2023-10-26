import React from "react";
import { HiMiniChatBubbleLeftRight } from "react-icons/hi2";

function Logo() {
	return (
		<div className="p-4 pt-12 flex items-center gap-2 text-blue-600 font-bold">
			<HiMiniChatBubbleLeftRight className="text-3xl" />
			<span className="text-[30px] sm:text-[40px] md:text-[50px]">ChatApp</span>
		</div>
	);
}

export default Logo;

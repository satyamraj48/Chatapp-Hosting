import React from "react";
import { BiSolidVideo } from "react-icons/bi";
import { IoMdArrowBack, IoMdCall } from "react-icons/io";

function DetailsBar({
	showList,
	setShowList,
	onlinePeople,
	offlinePeople,
	selectedUserId,
	handleAudioCall,
	handleVideoCall,
}) {
	return (
		<div className="absolute z-[200] top-0 w-full h-[60px] pl-2 flex items-center justify-between gap-1 bg-blue-700 text-white">
			<div className="flex items-center gap-3">
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
			{selectedUserId && (
				<div className="mx-6 bg-pink-30 flex items-center gap-2">
					<button
						className="drop-shadow-md hover:bg-blue-500 rounded-full p-1 active:scale-95"
						onClick={handleAudioCall}
					>
						<IoMdCall className="text-xl" />
					</button>
					<button
						className="drop-shadow-md hover:bg-blue-500 rounded-full p-1 active:scale-95"
						onClick={handleVideoCall}
					>
						<BiSolidVideo className="text-xl" />
					</button>
				</div>
			)}
		</div>
	);
}

export default DetailsBar;

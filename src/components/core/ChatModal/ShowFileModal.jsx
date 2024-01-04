import React, { useRef } from "react";
import { IoClose } from "react-icons/io5";

function ShowFileModal({ showFileModal, setShowFileModal }) {
	const videoPlayRef = useRef(null);

	return (
		<div className="fixed inset-0 z-[400] w-full h-full flex items-center justify-center backdrop-blur-lg bg-white/20">
			<div className="w-[80%] h-full bg-transparent rounded-md flex items-center justify-center">
				<div className="mx-10 my-8 h-[80%] flex flex-col items-end justify-center gap-2">
					<button
						className="bg-gray-500 text-gray-50 font-semibold drop-shadow-lg hover:bg-gray-700 hover:drop-shadow-md p-[2px] rounded-full"
						onClick={() => {
							setShowFileModal(null);
						}}
					>
						<IoClose className="text-xl" />
					</button>
					{showFileModal.includes("/image/") ? (
						<img
							src={showFileModal}
							className="max-h-[60%] object-contain rounded-lg drop-shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer"
						/>
					) : (
						<video
							src={showFileModal}
							ref={videoPlayRef}
							onClick={() => {
								videoPlayRef.current.play();
							}}
							className="max-h-[40%] lg:max-h-[60%] object-contain rounded-lg drop-shadow-md hover:shadow-2xl transition-all duration-500"
						></video>
					)}
				</div>
			</div>
		</div>
	);
}

export default ShowFileModal;

import React, { useRef } from "react";
import { IoClose } from "react-icons/io5";

function ShowFileModal({ showFileModal, setShowFileModal }) {
	const videoPlayRef = useRef(null);

	return (
		<div className="fixed inset-0 z-[400] w-full h-full flex items-center justify-center backdrop-blur-lg bg-white/10">
			<div className="w-[80%] bg-transparent rounded-md flex items-center justify-center">
				<div className="mx-10 my-8 w-[80%] max-h-screen flex flex-col items-end gap-2">
					<button
						className="bg-gray-50 text-black font-semibold drop-shadow-lg hover:bg-gray-100 hover:drop-shadow-md p-[2px] rounded-full"
						onClick={() => {
							setShowFileModal(null);
						}}
					>
						<IoClose className="text-xl text-gray-700" />
					</button>
					{showFileModal.includes("/image/") ? (
						<img
							src={showFileModal}
							className="h-[60%] object-contain rounded-lg drop-shadow-md cursor-pointer"
						/>
					) : (
						<video
							src={showFileModal}
							ref={videoPlayRef}
							onClick={() => {
								videoPlayRef.current.play();
							}}
							className="h-[40%] lg:h-[60%] object-contain rounded-lg drop-shadow-md"
						></video>
					)}
				</div>
			</div>
		</div>
	);
}

export default ShowFileModal;

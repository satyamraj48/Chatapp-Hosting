import React from "react";
import { FiSend } from "react-icons/fi";
import { IoClose } from "react-icons/io5";

function PreviewMediaModal({
	previewSourceModal,
	setPreviewSourceModal,
	imageFile,
	setImageFile,
	sendMessage,
}) {
	return (
		<div className="fixed inset-0 z-[400] flex flex-col items-center justify-center backdrop-blur-md bg-white/10">
			{imageFile.type.includes("image") ? (
				<img
					src={previewSourceModal}
					className="h-[70%] object-cover rounded-lg shadow-lg"
				/>
			) : (
				<video
					src={previewSourceModal}
					className="h-[40%] object-contain rounded-lg drop-shadow-md"
				></video>
			)}
			<div className="mt-5 flex items-center gap-4">
				<button
					className="bg-gray-600 px-5 py-3 rounded-lg shadow-lg group"
					onClick={() => {
						setImageFile(null);
						setPreviewSourceModal(null);
					}}
				>
					<div className="flex items-center gap-1 text-white">
						<span>Cancel</span>
						<IoClose className="text-xl group-hover:text-red-500" />
					</div>
				</button>
				<button
					className="bg-blue-500 px-5 py-3 rounded-lg shadow-lg group"
					onClick={sendMessage}
				>
					<div className="flex items-center gap-1 text-white">
						<span>Send</span>
						<FiSend className="text-lg text-white group-hover:scale-110" />
					</div>
				</button>
			</div>
		</div>
	);
}

export default PreviewMediaModal;

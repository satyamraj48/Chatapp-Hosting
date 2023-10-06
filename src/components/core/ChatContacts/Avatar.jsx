import React from "react";

function Avatar({ userId, username, online }) {
	const colors = [
		"bg-teal-200",
		"bg-red-200",
		"bg-green-200",
		"bg-purple-200",
		"bg-blue-200",
		"bg-yellow-200",
	];

	const userIdBase10 = parseInt(userId, 16);
	const colorIndex = userIdBase10 % colors.length;
	const color = colors[colorIndex];
	// console.log(colorIndex);

	return (
		<div
			className={`relative w-8 h-8 flex items-center ${color} rounded-full `}
		>

			<div className="w-full text-center opacity-70 capitalize">
				{username[0]}
			</div>

			<div
				className={`absolute bottom-0 right-0 w-3 h-3 ${
					online ? "bg-green-600" : "bg-gray-400"
				} rounded-full border border-white shadow-lg shadow-white `}
			></div>
			
		</div>
	);
}

export default Avatar;

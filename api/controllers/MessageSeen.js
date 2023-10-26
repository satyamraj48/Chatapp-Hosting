const MessageSeen = require("../models/MessageSeen");

exports.getSeenAt = async (req, res) => {
	try {
		const { selectedUserId } = req.params;
		const userId = req.user.id;
		// console.log(selectedUserId, userId);

		const seenAt = await MessageSeen.findOne({
			dekha: selectedUserId,
			ptachala: userId,
		}).exec();

		res.json({
			success: true,
			message: "MessageSeen fetched Successfully",
			data: seenAt,
		});
	} catch (error) {
		console.log(error);
		return res.status(401).json({
			success: false,
			message: "Error in MessageSeen",
			error: error.message,
		});
	}
};

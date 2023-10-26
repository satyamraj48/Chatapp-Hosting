const mongoose = require("mongoose");

const MessageSeenSchema = new mongoose.Schema(
	{
		dekha: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		ptachala: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		seenAt: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("MessageSeen", MessageSeenSchema);

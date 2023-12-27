const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
	{
		fileId: String,
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		recipient: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		text: String,
		file: String,
		sentAt: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);

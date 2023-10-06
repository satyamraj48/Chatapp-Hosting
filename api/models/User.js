const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		username: { type: String, unique: true, required: true },
		password: { type: String, required: true },
		messages: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

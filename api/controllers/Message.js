const Message = require("../models/Message");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

exports.getMessages = async (req, res) => {
	try {
		const { selectedUserId } = req.params;
		const userId = req.user.id;
		// console.log(selectedUserId, userId);

		let allMessages = await Message.find({
			sender: { $in: [userId, selectedUserId] },
			recipient: { $in: [userId, selectedUserId] },
		})
			.sort({ createdAt: 1 })
			.exec();

		res.json({
			success: true,
			message: "Messages fetched Successfully",
			data: allMessages,
		});
	} catch (error) {
		console.log(error);
		return res.status(401).json({
			success: false,
			message: "Error in getting Messages",
			error: error.message,
		});
	}
};

exports.saveImages = async (req, res) => {
	try {
		const { imageFile } = req.files;
		const { sentAt, fileId } = req.body;
		const { selectedUserId } = req.params;
		const userId = req.user.id;

		// console.log(selectedUserId, userId);

		if (imageFile) {
			try {
				const uploadedFileDetails = await uploadImageToCloudinary(
					imageFile,
					process.env.FOLDER_NAME,
					1000,
					1000
				);
				const fileSecureUrl = uploadedFileDetails.secure_url;
				// console.log("img url --> ", fileSecureUrl);
				if (selectedUserId) {
					await Message.create({
						fileId: fileId,
						sender: userId,
						recipient: selectedUserId,
						file: fileSecureUrl,
						sentAt: sentAt,
					});
					// console.log("file saved");
				}
			} catch (error) {
				console.log("Cloudinary Error....", error);
			}
		}
		res.json({
			success: true,
			message: "File saved Successfully",
		});
	} catch (error) {
		console.log(error);
		return res.status(401).json({
			success: false,
			message: "Error in saving file",
			error: error.message,
		});
	}
};

exports.getOnlinePeople = async (req, res) => {
	try {
		const allOnlinePeople = await User.find({}, { _id: 1, username: 1 });

		res.json({
			success: true,
			message: "Online People fetched Successfully",
			data: allOnlinePeople,
		});
	} catch (error) {
		console.log(error);
		return res.status(401).json({
			success: false,
			message: "Error in getting Online People",
			error: error.message,
		});
	}
};

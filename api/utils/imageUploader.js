const cloudinary = require("cloudinary").v2;
require("dotenv").config();

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
	const options = { folder };
	if (height) options.height = height;
	if (quality) options.quality = quality;
	options.resource_type = "image";
	// options.public_id = Date.now();
	console.log("cloud file--> ", file);
	console.log("options--> ", options);

	return await cloudinary.uploader.upload(file.tempFilePath, options);
};

exports.deleteFileFromCloudinary = async (file, folder) => {
	const public_id = folder + "/" + file.split("/").pop().split(".")[0];
	console.log("To delete video is ->  ", public_id);
	const options = { resource_type: "video" };
	const output = await cloudinary.uploader.destroy(public_id, options);
	console.log("Video deleted from Cloudinary -> ", output);
};

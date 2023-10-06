const mongoose = require("mongoose");
require("dotenv").config();

exports.dbConnect = () => {
	try {
		mongoose.connect(process.env.MONGODB_URL, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log("DB Connection Successful");
	} catch (error) {
		console.log("DB Connection Issue");
		console.error(error);
		process.exit(1);
	}
};

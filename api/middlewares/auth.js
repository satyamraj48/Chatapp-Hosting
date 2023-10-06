const jwt = require("jsonwebtoken");

exports.auth = async (req, res, next) => {
	try {
		const token = req.cookies?.token;
		// || req.header("Authorization").replace("Bearer ", "");

		if (!token)
			return res.status(401).json({
				success: false,
				message: "Token is missing",
			});
		// console.log("token-> ", token);

		//verify token
		try {
			const decode = jwt.verify(token, process.env.JWT_SECRET);
			// console.log("decode-> ", decode);
			req.user = decode;
		} catch (error) {
			console.log(error);
			return res.status(401).json({
				success: false,
				message: "Token is invalid",
			});
		}
		next();
	} catch (error) {
		console.log(error);
		return res.status(401).json({
			success: false,
			message: "Something went wrong while validating the token",
		});
	}
};

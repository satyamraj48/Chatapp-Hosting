const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

//sign up
exports.signup = async (req, res) => {
	try {
		const { username, password } = req.body;

		const hashedPassword = await bcrypt.hash(password, 10);

		await User.create({ username, password: hashedPassword });

		res.status(200).json({
			success: true,
			message: "User Created Successfully",
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			message: "Error in creating User. Please try again",
		});
	}
};

//login
exports.login = async (req, res) => {
	try {
		const { username, password } = req.body;

		let user = await User.findOne({ username });

		if (!user)
			return res.status(403).json({
				success: false,
				message: "User not found",
			});

		if (await bcrypt.compare(password, user.password)) {
			const payload = {
				username: user.username,
				id: user._id,
			};
			const token = jwt.sign(payload, process.env.JWT_SECRET, {
				expiresIn: "10h",
			});
			user = user.toObject();
			user.password = undefined;
			const options = {
				expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
				// httpOnly: true,
				sameSite: "none",
				secure: true,
			};
			res.cookie("token", token, options).status(200).json({
				success: true,
				user,
				token,
				message: "Logged in Successfully",
			});
		} else {
			return res.status(401).json({
				success: false,
				message: "Error in Password",
			});
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			message: "Error in creating User and Login issue. Please try again",
		});
	}
};

//logout
exports.logout = async (req, res) => {
	try {
		const userId = req.user.id;
		console.log(userId);
		const user = await User.findById(userId);

		if (!user)
			return res.status(403).json({
				success: false,
				message: "User not found",
			});

		const options = {
			// httpOnly: true,
			sameSite: "none",
			secure: true,
		};
		res.cookie("token", "", options).status(200).json({
			success: true,
			message: "Logout Successfully",
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			message: "Error in Logout",
		});
	}
};

//profile
exports.profile = async (req, res) => {
	try {
		const userId = req.user.id;
		const username = req.user.username;

		res.json({ success: true, userId, username });
	} catch (error) {
		console.log(error);
		return res.status(401).json({
			success: false,
			message: "Error in Profile",
		});
	}
};

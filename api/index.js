const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const { dbConnect } = require("./config/database");
const { cloudinaryConnect } = require("./config/cloudinary");
const { uploadImageToCloudinary } = require("./utils/imageUploader");

const cookieParser = require("cookie-parser");
const cors = require("cors");

const userRoutes = require("./routes/User");

const Message = require("./models/Message");
const MessageSeen = require("./models/MessageSeen");

const jwt = require("jsonwebtoken");
const fileUpload = require("express-fileupload");
const Buffer = require("buffer/").Buffer;

require("dotenv").config();
const PORT = process.env.PORT;

//databse connect
dbConnect();

// cloudinary connect
cloudinaryConnect();

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(
	cors({
		origin: true,
		credentials: true,
	})
);
app.use(
	fileUpload({
		useTempFiles: true,
		tempFileDir: "/tmp/",
	})
);

//routes
app.use("/api/v1/auth", userRoutes);

//default route
app.get("/", (req, res) => {
	res.json({
		success: true,
		message: "Your Server is up and running....",
	});
});

//initiate socket io
const { createServer } = require("http");
const httpServer = createServer(app);
const { Server } = require("socket.io");

const io = new Server(httpServer, {
	cors: true,
});

httpServer.listen(PORT, () => {
	console.log("Server is live at ", PORT);
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();
const userIdToSocketIdMap = new Map();
const userIdToUsernameMap = new Map();

io.on("connection", (socket) => {
	console.log("socket io", socket.id);

	function notifyAboutOnlinePeople() {
		//notify everyone about online people (when someone connects)
		let onlinePeople = [];
		for (const [userId, socketId] of userIdToSocketIdMap) {
			onlinePeople = [
				...onlinePeople,
				{ userId: userId, username: userIdToUsernameMap.get(userId) },
			];
		}
		for (const [userId, socketId] of userIdToSocketIdMap) {
			io.to(socketId).emit("online:users", { onlinePeople });
		}
	}

	io.engine.on("headers", (headers, req) => {
		// console.log("cookie-> ", req.headers.cookie);
		const cookies = req.headers.cookie;

		//read userId and username from their cookie for this connection
		if (cookies) {
			const tokenCookieString = cookies
				.split(";")
				.find((str) => str.startsWith("token="));
			if (tokenCookieString) {
				const token = tokenCookieString.split("=")[1];
				if (token) {
					try {
						// console.log("token-> ", token);
						const decode = jwt.verify(token, process.env.JWT_SECRET);
						// console.log("decode-> ", decode);
						const { id: userId, username } = decode;

						//map user Id to Socket Id
						userIdToSocketIdMap.set(userId, socket.id);
						userIdToUsernameMap.set(userId, username);

						//notify all about online people
						notifyAboutOnlinePeople();
					} catch (error) {
						console.log(error);
					}
				}
			}
		}
	});

	socket.on("login:request", ({ token }) => {
		if (token) {
			try {
				// console.log("token-> ", token);
				const decode = jwt.verify(token, process.env.JWT_SECRET);
				// console.log("decode-> ", decode);
				const { id: userId, username } = decode;
				socket.emit("login:success", { userId, username });

				//map user Id to Socket Id
				userIdToSocketIdMap.set(userId, socket.id);
				userIdToUsernameMap.set(userId, username);

				//notify all about online people
				notifyAboutOnlinePeople();
			} catch (error) {
				console.log(error);
			}
		}
	});

	socket.on("room:join", ({ roomId, emailId, recipient }) => {
		console.log("2 6 User -> ", emailId, "Joined Room -> ", roomId);
		emailToSocketIdMap.set(emailId, socket.id);
		socketIdToEmailMap.set(socket.id, emailId);
		io.to(roomId).emit("user:joined", { emailId, joinerId: socket.id });
		socket.join(roomId);
		io.to(socket.id).emit("room:join", {
			roomId,
			emailId,
			recipient,
		});
		if (roomId && !recipient) {
			const userId = roomId.split("|")[1];
			const socketId = userIdToSocketIdMap.get(userId);
			console.log("6 room joined and inform start that other person joined");
			io.to(socketId).emit("remote:person:joined:flag", { joined: userId });
		}
	});

	socket.on("outgoing:videoCall", ({ sender, to, roomId }) => {
		if (to && roomId) {
			console.log("4 video call aaya idhar");
			const socketId = userIdToSocketIdMap.get(to);
			io.to(socketId).emit("incoming:videoCall", { sender, roomId });
		}
	});

	socket.on("cancel:videoCall", ({ to }) => {
		io.to(to).emit("cancel:videoCall", { from: socket.id });
	});

	socket.on("user:call", ({ to, offer, isVideoCall }) => {
		let senderUsername = null;
		for (const [userId, socketId] of userIdToSocketIdMap) {
			if (socketId === socket.id) {
				senderUsername = userIdToUsernameMap.get(userId);
				break;
			}
		}
		if (senderUsername) {
			io.to(to).emit("incoming:call", {
				from: socket.id,
				fromUsername: senderUsername,
				offer,
				isVideoCall,
			});
		}
	});

	socket.on("call:accepted", ({ to, ans }) => {
		io.to(to).emit("call:accepted", {
			from: socket.id,
			ans,
		});
	});

	socket.on("peer:nego:needed", ({ to, offer }) => {
		io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
	});

	socket.on("peer:nego:done", ({ to, ans }) => {
		io.to(to).emit("peer:nego:final", { from: socket.id, ans });
	});

	socket.on("outgoing:message", async (messageData) => {
		const { recipient, text, file, sentAt } = messageData;
		let imageSecureUrl = null;
		console.log("be-> imageFile--> ", file);

		if (!file) {
			try {
				const uploadedImage = await uploadImageToCloudinary(
					file,
					process.env.FOLDER_NAME
					// 1000,
					// 1000
				);
				imageSecureUrl = uploadedImage.secure_url;
				console.log("img url --> ", imageSecureUrl);
			} catch (error) {
				console.log("Cloudinary Error....", error);
			}
		}
		if (recipient && (text || file)) {
			//save in DB
			let senderUserId = null;
			for (const [userId, socketId] of userIdToSocketIdMap) {
				if (socketId === socket.id) {
					senderUserId = userId;
					break;
				}
			}
			if (senderUserId) {
				const messageDoc = await Message.create({
					sender: senderUserId,
					recipient: recipient,
					text: text,
					file: file ? file : null,
					sentAt: sentAt,
				});

				//send message to the recipient
				const socketId = userIdToSocketIdMap.get(recipient);
				if (socketId) {
					io.to(socketId).emit("incoming:message", {
						text: text,
						file: file ? file : null,
						sender: senderUserId,
						recipient: recipient,
						_id: messageDoc._id,
						sentAt: sentAt,
					});
				}
			}
		}
	});

	socket.on("seen:message", async ({ ptachala, seenAt }) => {
		if (ptachala && seenAt) {
			let dekhaUserId = null;
			for (const [userId, socketId] of userIdToSocketIdMap) {
				if (socketId === socket.id) {
					dekhaUserId = userId;
					break;
				}
			}
			if (dekhaUserId) {
				// seenAt -> is(dekha) user ka seen time
				const messageSeenDetails = await MessageSeen.findOne({
					dekha: dekhaUserId,
					ptachala: ptachala,
				});

				if (messageSeenDetails) {
					await MessageSeen.findOneAndUpdate(
						{ dekha: dekhaUserId, ptachala: ptachala },
						{ seenAt: seenAt }
					);
				} else {
					await MessageSeen.create({
						dekha: dekhaUserId,
						ptachala: ptachala,
						seenAt: seenAt,
					});
				}
				// console.log("ptachala");

				const socketId = userIdToSocketIdMap.get(ptachala);
				if (socketId) {
					io.to(socketId).emit("seenAt:message", {
						dekha: dekhaUserId,
						ptachala: ptachala,
						seenAt: seenAt,
					});
				}
			}
		}
	});
});

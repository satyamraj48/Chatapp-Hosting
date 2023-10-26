const express = require("express");
const app = express();
const { dbConnect } = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const userRoutes = require("./routes/User");
const ws = require("ws");
const jwt = require("jsonwebtoken");
const Message = require("./models/Message");
const { fs } = require("file-system");
const MessageSeen = require("./models/MessageSeen");
const Buffer = require("buffer/").Buffer;

require("dotenv").config();
const PORT = process.env.PORT;

//databse connect
dbConnect();

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(
	cors({
		origin: true,
		credentials: true,
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

const server = app.listen(PORT, () => {
	console.log("Server is live at", PORT);
});

//web socket server
const wss = new ws.WebSocketServer({ server });

wss.on("connection", (connection, req) => {
	console.log("Socket connected");

	function notifyAboutOnlinePeople() {
		//notify everyone about online people (when someone connects)
		[...wss.clients].forEach((client) => {
			client.send(
				JSON.stringify({
					online: [...wss.clients].map((c) => ({
						userId: c.userId,
						username: c.username,
					})),
				})
			);
		});
	}

	connection.isAlive = true;

	connection.timer = setInterval(() => {
		connection.ping();
		connection.expireTimer = setTimeout(() => {
			connection.isAlive = false;
			connection.terminate();
			notifyAboutOnlinePeople();
			// console.log("expire");
			clearInterval(connection.timer);
		}, 1000);
	}, 5000);

	connection.on("pong", () => {
		clearTimeout(connection.expireTimer);
	});

	//read userId and username from their cookie for this connection
	const cookies = req.headers.cookie;
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

					connection.userId = userId;
					connection.username = username;
				} catch (error) {
					console.log(error);
				}
			}
		}
	}

	connection.on("message", async (message) => {
		const messageData = JSON.parse(message.toString());
		// console.log("md-> ",messageData);
		const { recipient, text, file, sentAt, ptachala, seenAt } = messageData;
		let filename = null;

		if (file) {
			// console.log(file);
			const parts = file.info.split(".");
			const ext = parts[parts.length - 1];
			filename = Date.now() + "." + ext;
			const path = __dirname + "/uploads/" + filename;
			const bufferData = new Buffer(file.data.split(",")[1], "base64");
			fs.writeFile(path, bufferData, () => {
				console.log("file saved: " + path);
			});
		}
		if (recipient && (text || file)) {
			//save in DB
			const messageDoc = await Message.create({
				sender: connection.userId,
				recipient: recipient,
				text: text,
				file: file ? filename : null,
				sentAt: sentAt,
			});

			[...wss.clients]
				.filter((c) => c.userId === recipient)
				.forEach((c) =>
					c.send(
						JSON.stringify({
							text: text,
							file: file ? filename : null,
							sender: connection.userId,
							recipient: recipient,
							_id: messageDoc._id,
							sentAt: sentAt,
						})
					)
				);
		}

		if (ptachala && seenAt) {
			// seenAt -> is(dekha) user ka seen time 
			const messageSeenDetails = await MessageSeen.findOne({
				dekha: connection.userId,
				ptachala: ptachala,
			});

			if (messageSeenDetails) {
				await MessageSeen.findOneAndUpdate(
					{ dekha: connection.userId, ptachala: ptachala },
					{ seenAt: seenAt }
				);
			} else {
				await MessageSeen.create({
					dekha: connection.userId,
					ptachala: ptachala,
					seenAt: seenAt,
				});
			}
			// console.log("ptachala");

			[...wss.clients]
				.filter((c) => c.userId === ptachala)
				.forEach((c) =>
					c.send(
						JSON.stringify({
							dekha: connection.userId,
							ptachala: ptachala,
							seenAt: seenAt,
						})
					)
				);
		}
	});

	//notify online people to every client(socket)
	notifyAboutOnlinePeople();
});

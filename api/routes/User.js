const express = require("express");
const router = express.Router();
const { login, signup, profile, logout } = require("../controllers/Auth");
const { auth } = require("../middlewares/auth");
const { getMessages, getOnlinePeople } = require("../controllers/Message");
const { getSeenAt } = require("../controllers/MessageSeen");

//route for user signup
router.post("/signup", signup);

//route for user login
router.post("/login", login);

//route for user logout
router.post("/logout", auth, logout);

//router for profile
router.get("/profile", auth, profile);

//router for getting all messages for specific user
router.get("/messages/:selectedUserId", auth, getMessages);

//router for getting messages seen
router.get("/messageseen/:selectedUserId", auth, getSeenAt);

//router for getting all online people
router.get("/people", auth, getOnlinePeople);

module.exports = router;

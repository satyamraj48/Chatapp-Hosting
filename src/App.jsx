import "./App.css";
import RegisterAndLoginForm from "./Pages/RegisterAndLoginForm";
import axios from "axios";
import { UserContext } from "./Pages/UserContext";
import { useContext, useEffect } from "react";
import Chat from "./Pages/Chat";
import { Routes, Route } from "react-router-dom";
import Room from "./Pages/Room";

function App() {
	axios.defaults.baseURL = import.meta.env.VITE_REACT_APP_BASE_URL;
	// console.log(import.meta.env.VITE_REACT_APP_BASE_URL);
	axios.defaults.withCredentials = true;

	const {
		username,
		setUsername: setLoggedInUsername,
		setId,
	} = useContext(UserContext);

	useEffect(() => {
		const getProfileDetails = async () => {
			const response = await axios.get("/auth/profile");
			// console.log("Profile-> ", response.data);
			if (response.data.success) {
				setId(response.data.userId);
				setLoggedInUsername(response.data.username);
			}
		};
		getProfileDetails();
	}, []);

	if (username) {
		return (
			<Routes>
				<Route path="/" element={<Chat />} />
				<Route path="/room/:roomId" element={<Room />} />
			</Routes>
		);
	} else {
		return (
			<Routes>
				<Route path="/" element={<RegisterAndLoginForm />} />
			</Routes>
		);
	}
}

export default App;

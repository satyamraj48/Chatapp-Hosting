import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import toast from "react-hot-toast";

function RegisterAndLoginForm() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoginOrRegister, setIsLoginOrRegister] = useState("login");

	const {
		setUsername: setLoggedInUsername,
		setId,
		socket,
	} = useContext(UserContext);

	async function handleSubmit(e) {
		e.preventDefault();
		if (isLoginOrRegister === "register") {
			const signupResponse = await axios.post("/auth/signup", {
				username,
				password,
			});
			if (signupResponse.data.success) {
				toast.success("Registered Successfully");
			} else {
				toast.error("Registration Failed");
			}
		} else {
			const loginResponse = await axios.post("/auth/login", {
				username,
				password,
			});
			// console.log("login response-> ", loginResponse);
			if (loginResponse.data.success) {
				//verifying the login details
				socket.emit("login:request", { token: loginResponse.data.token });
			} else {
				toast.error("Login Failed");
			}
		}
	}

	function handleLoginSuccess({ userId, username }) {
		if (userId && username) {
			toast.success("Logged in Successfully");
			setLoggedInUsername(username);
			setId(userId);
		}
	}

	useEffect(() => {
		//on verified
		socket.on("login:success", handleLoginSuccess);
		return () => {
			socket.off("login:success", handleLoginSuccess);
		};
	}, [socket, handleLoginSuccess]);

	return (
		<div className="bg-blue-50 h-screen flex items-center font-Poppins">
			<form onSubmit={handleSubmit} className="mx-auto w-72 mb-12">
				<input
					type="text"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					placeholder="username"
					className="block w-full rounded-sm p-2 mb-2 border"
				/>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="password"
					className="block w-full rounded-sm p-2 mb-2 border"
				/>
				<button className="bg-blue-500 text-white w-full rounded-sm p-2">
					{isLoginOrRegister === "register" ? "Register" : "Login"}
				</button>
				<div className="mt-2 text-center">
					{isLoginOrRegister === "register" ? (
						<div>
							Already a member?{" "}
							<button
								type="button"
								className="hover:text-blue-800 hover:underline"
								onClick={() => setIsLoginOrRegister("login")}
							>
								Login here
							</button>
						</div>
					) : (
						<div>
							Don't have an account?{" "}
							<button
								type="button"
								className="hover:text-blue-800 hover:underline"
								onClick={() => setIsLoginOrRegister("register")}
							>
								Register here
							</button>
						</div>
					)}
				</div>
			</form>
		</div>
	);
}

export default RegisterAndLoginForm;

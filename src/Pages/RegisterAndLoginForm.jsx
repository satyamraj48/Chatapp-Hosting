import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import toast from "react-hot-toast";
import { HiMiniChatBubbleLeftRight } from "react-icons/hi2";

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
		<div className="bg-gradient-to-r from-[#e2e2ea] to-[#c9d6ff] min-w-full h-screen flex items-center justify-center font-Poppins">
			<div
				className={`relative w-[80%] max-w-[750px] h-[30%] min-h-[280px] max-h-[370px] sm:h-[32%] md:h-[45%] lg:h-[50%] flex items-center bg-white rounded-2xl shadow-2xl shadow-blue-900/25`}
			>
				<div
					className={`w-[52%] h-full px-2 bg-gradient-to-t from-[#3c6bc0] to-[#112da8] text-white ${
						isLoginOrRegister === "login"
							? "translate-x-[0%] rounded-br-[110px] rounded-tr-[150px] rounded-l-2xl"
							: "translate-x-[100%] rounded-bl-[110px] rounded-tl-[150px] rounded-r-2xl"
					} transition-all duration-700 ease-in-out z-[10]`}
				>
					<div
						className={`${
							isLoginOrRegister === "login" ? "hidden" : "flex"
						} flex-col items-center justify-center h-full bg-yellow-30 text-center`}
					>
						<p className="text-[20px] sm:text-[26px] font-semibold">
							Welcome Back!
						</p>
						<p className="mt-4 sm:mt-8 w-[80%] text-xs tracking-wide ">
							Enter your personal setails to use all of site features
						</p>
						<button
							className="mt-4 sm:mt-8 text-xs sm:text-md text-white w-fit rounded-lg px-4 sm:px-8 py-2 border uppercase"
							onClick={() => setIsLoginOrRegister("login")}
						>
							Sign In
						</button>
					</div>
					<div
						className={`${
							isLoginOrRegister === "login" ? "flex" : "hidden"
						} flex-col items-center justify-center h-full bg-yellow-30 text-center`}
					>
						<p className="text-[20px] sm:text-[26px] font-semibold">
							Hello, Friend!
						</p>
						<p className="mt-4 sm:mt-8 w-[80%] text-xs tracking-wide ">
							Register with your personal details to use all of site features
						</p>
						<button
							className="mt-4 sm:mt-8 text-xs sm:text-md text-white w-fit rounded-lg px-4 sm:px-8 py-2 border uppercase"
							onClick={() => setIsLoginOrRegister("register")}
						>
							Sign Up
						</button>
					</div>
				</div>

				<form
					onSubmit={handleSubmit}
					className={`px-4 bg-pink-30 w-[50%] h-full flex flex-col items-center justify-center ${
						isLoginOrRegister === "login"
							? "translate-x-[0%]"
							: "translate-x-[-100%]"
					} transition-all duration-700 ease-in-out`}
				>

					<p className="my-4 sm:mb-8 w-3/5 text-[24px] sm:text-[30px] leading-tight font-semibold text-center">
						{isLoginOrRegister === "login" ? "Sign In" : "Create Account"}
					</p>

					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="username"
						className="bg-red-50 w-[90%] rounded-lg p-2 pl-3 placeholder:opacity-60 outline-none text-[14px]"
					/>

					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="password"
						className="mt-1 sm:mt-3 bg-red-50 w-[90%] rounded-lg p-2 pl-3 placeholder:opacity-60 outline-none text-[14px]"
					/>

					<button className="mt-5 sm:mt-8 mb-3 bg-blue-600 text-sm sm:text-md text-white w-fit rounded-md px-3 sm:px-6 py-1 sm:py-2 uppercase">
						{isLoginOrRegister === "register" ? "Sign Up" : "Login"}
					</button>

					{/* logo */}
					<div className="absolute bottom-2 hidden md:flex items-center gap-1 opacity- text-blue-60 font-bold">
						<HiMiniChatBubbleLeftRight className="text-xs text-blue-400" />
						<span className="bg-gradient-to-tr from-blue-500 to-blue-400 bg-clip-text text-transparent text-sm">
							ChatApp
						</span>
					</div>

				</form>
			</div>
		</div>
	);
}

export default RegisterAndLoginForm;

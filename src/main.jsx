import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import UserContextProvider from "./Pages/UserContext.jsx";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
	<>
		<BrowserRouter>
			<UserContextProvider>
				<App />
			</UserContextProvider>
			<Toaster />
		</BrowserRouter>
	</>
);

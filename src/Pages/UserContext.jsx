import React, { createContext, useState } from "react";

export const UserContext = createContext({});

function UserContextProvider({ children }) {
	const [username, setUsername] = useState(null);
	const [id, setId] = useState(null);

	const providedValue = { username, setUsername, id, setId };

	return (
		<UserContext.Provider value={providedValue}>
			{children}
		</UserContext.Provider>
	);
}

export default UserContextProvider;

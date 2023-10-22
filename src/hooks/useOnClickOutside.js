import { useEffect } from "react";

// This hook detects clicks outside of the specified component and calls the provided handler function.
export default function useOnClickOutside(ref, handler) {
	//window width
	const getWindowSize = () => {
		const pageWidth = window.matchMedia("(min-width: 768px)");
		if (pageWidth.matches) {
			return true;
		} else {
			return false;
		}
	};

	useEffect(() => {
		// Define the listener function to be called on click/touch events
		const listener = (event) => {
			// If the click/touch event originated inside the ref element, do nothing
			if (!ref.current || !ref.current.contains(event.target)) return;

			// Otherwise, call the provided handler function
			if (!getWindowSize()) handler(event);
		};

		// Add event listeners for mousedown and touchstart events on the document
		document.addEventListener("mousedown", listener);
		document.addEventListener("touchstart", listener);

		// Cleanup function to remove the event listeners when the component unmounts or when the ref/handler dependencies change
		return () => {
			document.removeEventListener("mousedown", listener);
			document.removeEventListener("touchstart", listener);
		};
	}, [ref, handler]); // Only run this effect when the ref or handler function changes
}

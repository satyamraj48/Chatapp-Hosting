/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{html,js,jsx}"],
	theme: {
		fontFamily: {
			Poppins: ["Poppins", "sans-serif"],
		},
		extend: {
			backgroundImage: {
				'doodle-pattern': "url('/assets/Chat - doodle.jpg')",
			  }
		},
	},
	plugins: [],
};

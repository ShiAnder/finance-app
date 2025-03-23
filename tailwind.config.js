module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        backdropBlur: {
          sm: '4px',
        },
        animation: {
          spin: 'spin 1s linear infinite',
        },
        keyframes: {
          spin: {
            to: { transform: 'rotate(360deg)' },
          }
        }
      },
    },
    plugins: [],
  }
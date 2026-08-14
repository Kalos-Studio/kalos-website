/**
 * Tailwind v4 is a PostCSS plugin — there is no tailwind.config.js in this
 * version. Theme values and content detection are configured from CSS instead,
 * in app/globals.css.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;

const { join, resolve } = require('path');

module.exports = {
  style: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },
  webpack: {
    alias: {
      '@': join(resolve(__dirname, './src')),
    },
  },
};

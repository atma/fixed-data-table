const autoprefixer = require('autoprefixer');
const postCSSCustomProperties = require('postcss-custom-properties');

const cssVars = require('./src/stubs/cssVar');

module.exports = {
  plugins: [
    autoprefixer,
    postCSSCustomProperties({ variables: cssVars.CSS_VARS })
  ]
};

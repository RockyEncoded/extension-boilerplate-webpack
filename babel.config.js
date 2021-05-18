module.exports = {
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-transform-async-to-generator',
    '@babel/plugin-proposal-function-bind'
  ],
  presets: ['@babel/preset-env']
}

// vue.config.js
module.exports = {
  // options...
  devServer: {
      disableHostCheck: true,
      proxy: {
        '^/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
  }
}

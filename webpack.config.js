// basic config webpack see: https://webpack.js.org/guides/typescript/
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = {

  mode: 'development',
  devServer: {
    port: 4000,
    hot: true,
    static: './dist',
  },
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        use: 'html-loader',
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
        exclude: /node_modules/
      },
      // load files
      // To use non-code assets with TypeScript a declaration is required
      // see file used-data-types.d.ts
      // -> https://webpack.js.org/guides/typescript/#importing-other-assets
      {
        test: /\.(png|jp(e*)g|svg|gif|raw|tif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'assets/'
            }
          }
        ]
      },
      {
        test: /\.(glsl|vs|fs)$/,
        loader: "ts-shader-loader"
      }
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    modules: [path.resolve(__dirname, 'src'), 'node_modules']
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    // serve html file to webpack bundles: https://webpack.js.org/plugins/html-webpack-plugin/
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
  ],
};

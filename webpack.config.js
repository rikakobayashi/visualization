const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  // モード値を production に設定すると最適化された状態で、
  // development に設定するとソースマップ有効でJSファイルが出力される
  mode: "development", // "production" | "development" | "none"

  // メインとなるJavaScriptファイル（エントリーポイント）
  entry: path.join(__dirname, "src/index.ts"),

  output: {
    path: path.join(__dirname, "dist"),
    filename: "main.js",
    publicPath: "/",
  },

  resolve: {
    extensions: [".ts", ".js", ".json"],
  },

  module: {
    rules: [
      {
        // 拡張子 .ts の場合
        test: /\.ts$/,
        // TypeScript をコンパイルする
        use: "ts-loader",
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "index.html"), // パスの指定
      filename: "index.html", // index.htmlをビルド
    }),
  ],
  // import 文で .ts ファイルを解決するため
  resolve: {
    modules: [
      "node_modules", // node_modules 内も対象とする
    ],
    extensions: [
      ".ts",
      ".js", // node_modulesのライブラリ読み込みに必要
    ],
  },
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    open: true,
    port: 3000,
  },
};

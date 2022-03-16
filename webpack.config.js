// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const P = require("./util/paths.json");
const tooling = require("./util/tooling.js");

const isProduction = process.env.NODE_ENV == "production";

const config = {
    target: "web",
    entry: `${P.entry.dir}${P.entry.file}.ts`,
    output: {
        path: path.resolve(__dirname, P.out),
        clean: true,
        filename: `${P.entry.file}.js`,
    },
    plugins: [
        tooling.copyBundle(P.bundle.path, P.bundle.out),
        tooling.statics(P.static.sources, P.static.dir, P.static.out),
        ...tooling.pug(P.pug),
    ],
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: "ts-loader",
                exclude: ["/node_modules/"],
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    "style-loader",
                    "css-loader",
                    "postcss-loader",
                    "sass-loader",
                ],
            },
            {
                test: /\.pug$/,
                loader: "pug-loader",
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: "asset",
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
};

module.exports = () => {
    if (isProduction) {
        config.mode = "production";
    } else {
        config.mode = "development";
    }
    return config;
};

// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const tooling = require("./util/tooling.js");
const childProcess = require("child_process");

const isProduction = process.env.NODE_ENV == "production";
const isWatchMode = process.env.WATCH;

const paths = {
    pug: "./src/templates/",
    out: "build/zola",
    static: {
        dir: "src/",
        sources: ["static/", "data/", "config.toml", "theme.toml"],
        out: "",
    },
    entry: {
        dir: "./src/",
        file: "bundle",
    },
    bundle: {
        path: "build/zola/bundle.js",
        out: "build/zola/static/bundle.js",
    },
};

const config = {
    target: "web",
    entry: `${paths.entry.dir}${paths.entry.file}.ts`,
    output: {
        path: path.resolve(__dirname, paths.out),
        clean: true,
        filename: `${paths.entry.file}.js`,
    },
    plugins: [
        tooling.copyBundle(paths.bundle.path, paths.bundle.out),
        tooling.statics(
            paths.static.sources,
            paths.static.dir,
            paths.static.out
        ),
        ...tooling.pug(paths.pug),
        {
            apply: (compiler) => {
                compiler.hooks.afterEmit.tap("ZolaCompile", (compilation) => {
                    const zola = childProcess.spawn("zola", [
                        "--root",
                        "build/zola",
                        "build",
                    ]);

                    zola.stdout.on("data", function (data) {
                        process.stdout.write(data);
                    });
                    zola.stderr.on("data", function (data) {
                        process.stderr.write(data);
                    });
                });

                compiler.hooks.done.tap("DevServer", (compilation) => {
                    if (isWatchMode) {
                        const reload = childProcess.spawn("reload", [
                            "--browser",
                            "--dir",
                            "./build/dist/",
                            "--port",
                            "9000",
                            "--verbose",
                        ]);

                        reload.stdout.on("data", function (data) {
                            process.stdout.write(data);
                        });
                        reload.stderr.on("data", function (data) {
                            process.stderr.write(data);
                        });
                    }

                    childProcess.exec(
                        `cp "${path.resolve(
                            __dirname,
                            "build",
                            "zola",
                            "bundle.js"
                        )}" "${path.resolve(
                            __dirname,
                            "build",
                            "dist",
                            "bundle.js"
                        )}"`
                    );
                });
            },
        },
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

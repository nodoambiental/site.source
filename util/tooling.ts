const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const EventHooksPlugin = require("event-hooks-webpack-plugin");
import * as FS from "fs-extra";

const createLoader = (name: string) =>
    new HtmlWebpackPlugin({
        template: `src/templates/${name}.pug`,
        filename: `templates/${name}.html`,
        chunks: [`${name}`],
    });

export const pug = (dir: string) => {
    const files = FS.readdirSync(dir).filter((file) => file.endsWith(".pug"));
    return files.map((file) => {
        const name = file.replace(".pug", "");
        return createLoader(name);
    });
};

export const statics = (files: string[], dir: string, out: string) =>
    new CopyWebpackPlugin({
        patterns: files.map((path) => {
            return {
                from: `${dir}${path}`,
                to: `${out}${path}`,
            };
        }),
    });

export const copyBundle = (source: string, out: string) =>
    new EventHooksPlugin({
        afterEmit: (compilation, done) => {
            FS.copy(source, out, done);
        },
    });

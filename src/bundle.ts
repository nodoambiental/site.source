// Tailwind/DaisyUI
import "./SCSS/input.scss";

// Logic
import * as Logic from "./logic/setup";

// Pug templates
const requireAll = (requirement: any) => {
    requirement.keys().forEach(requirement);
};
requireAll(require.context("./templates/", true, /\.pug$/));

// Themes
const { themeChange } = require("theme-change");
themeChange();

// Setup logic
(window as any).state = Logic.setup(); // HACK properly extend typings, come on

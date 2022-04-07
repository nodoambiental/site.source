// Tailwind/DaisyUI
import "./SCSS/input.scss";

// Logic
import "./logic/setup";

// Pug templates
const requireAll = (requirement: any) => {
    requirement.keys().forEach(requirement);
};
requireAll(require.context("./templates/", true, /\.pug$/));

// Themes
const { themeChange } = require("theme-change");
themeChange();

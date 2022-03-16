import meiosis from "meiosis-setup/functionPatches";
import simpleStream from "meiosis-setup/simple-stream";
import produce from "immer";
import { LitElement, render, html } from "lit";
import { customElement } from "lit/decorators.js";
import * as Store from "./store";
import { map } from "rxjs/operators";

// Requires configuring the root HTML tag with id "choccy"
const isChoccy = (): boolean => {
    const choccyElement = document.getElementById("choccy");
    if (choccyElement) {
        return choccyElement.tagName === "html" ? true : false;
    }
};

export const setup = () => {
    Store.init();
    return Store.state;
};

// export const setup = (): void => {
//     if (isChoccy()) {
//         const choccyChildren = document.getElementById("choccy").childNodes;
//         render(
//             <Choccy>${choccyChildren}</Choccy>,
//             document.getElementById("root")
//         );
//     }
// };

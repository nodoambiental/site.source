import meiosis from "meiosis-setup/functionPatches";
import simpleStream from "meiosis-setup/simple-stream";
import produce from "immer";
import { LitElement, render, html } from "lit";
import { customElement } from "lit/decorators.js";
import * as Store from "./store";
import { map } from "rxjs/operators";

// Requires configuring the root HTML tag with id "site"
const isSite = (): boolean => {
    const siteElement = document.getElementById("site");
    if (siteElement) {
        return siteElement.tagName === "html" ? true : false;
    }
};

export const setup = () => {
    Store.init();
    return Store.state;
};

// export const setup = (): void => {
//     if (isSite()) {
//         const siteChildren = document.getElementById("site").childNodes;
//         render(
//             <Site>${siteChildren}</Site>,
//             document.getElementById("root")
//         );
//     }
// };

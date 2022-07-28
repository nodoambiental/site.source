import * as Init from "./init";
import "./types";

const setupState = () => {
    return Init.state;
};

const setupAfterState = () => {
    Init.init();
};

// Setup logic
window.state = setupState();
setupAfterState();

// export const setup = (): void => {
//     if (isSite()) {
//         const siteChildren = document.getElementById("site").childNodes;
//         render(
//             <Site>${siteChildren}</Site>,
//             document.getElementById("root")
//         );
//     }
// };

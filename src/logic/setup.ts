import * as Init from "./init";

const setupState = () => {
    return Init.state;
};

const setupAfterState = () => {
    Init.init();
};

// Setup logic
(window as any).state = setupState(); // HACK properly extend typings, come on
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

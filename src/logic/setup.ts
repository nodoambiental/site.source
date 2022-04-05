import * as Init from "./init";

// Requires configuring the root HTML tag with id "site"
const isSite = (): boolean => {
    const siteElement = document.getElementById("site");
    if (siteElement) {
        return siteElement.tagName === "html" ? true : false;
    }
};

export const setup = () => {
    Init.init();
    return Init.state;
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

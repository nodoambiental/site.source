import type { DirectlyEditableHTMLProps } from "./types";

const arbitrarySet = <T>(value: T): T => {
    return value;
};

const arbitraryTransform = <T>(value: T, transform: (value: T) => T): T => {
    return transform(value);
};

const identity = <T>(value: T): T => value;

export const Primitives = {
    arbitrarySet,
    arbitraryTransform,
    identity,
};

export const Nodes = {
    innerHTML: (node: HTMLElement, payload: string) => {
        node.innerHTML = payload;
        return node;
    },
    opacity: (node: HTMLElement, payload: number) => {
        node.style.opacity = payload.toString();
        return node;
    },
    transform: (node: HTMLElement, payload: string) => {
        node.style.transform = payload;
        return node;
    },
    appendChild: (node: HTMLElement, ...[payload]: HTMLElement[]) => {
        node.append(payload);
        return node;
    },
    appendSibling: (
        node: HTMLElement,
        payload: {
            element: HTMLElement;
            placement: "beforebegin" | "afterbegin" | "beforeend" | "afterend";
        }
    ) => {
        node.insertAdjacentElement(payload.placement, payload.element);
        return node;
    },
    replace: (node: HTMLElement, payload: HTMLElement) => {
        return payload;
    },
    remove: (node: HTMLElement) => {
        node.remove();
        return document.createElement("span");
    },
};

import * as Init from "./init";
declare global {
    interface Window {
        state: typeof Init.state;
    }
}

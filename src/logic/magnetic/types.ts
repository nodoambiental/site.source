import type { WritableKeys, OmitProperties } from "ts-essentials";

export type DirectlyEditableHTMLProps = WritableKeys<
    OmitProperties<HTMLElement, object | Function>
>;

export type DirectlyEditableStyleProps = WritableKeys<HTMLElement["style"]>;

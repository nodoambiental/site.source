import * as Mag from "magnetic-js";
import i18n_en from "../i18n/en.json";
import i18n_es from "../i18n/es.json";

type Langs = {
    [lang: string]: Record<string, string>;
};

const langs: Langs = {
    en: i18n_en,
    es: i18n_es,
};

export const state = {
    UI: {
        media: {
            isMobile: new Mag.State(false),
        },
        queries: {
            load: new Mag.Events.ActiveEvent<boolean>("load", (event) => true),
            // selectLang: new MagCustomEvent<string, typeof window>(
            //     "language",
            //     window,
            //     (value, data: CustomEvent) => {
            //         return data.detail;
            //     }
            // ),
            mobile: new Mag.Events.WidthQuery(768),
        },
    },
    data: {},
    nodes: {
        potato: new Mag.Node("potato"),
    },
    components: {
        i18n: new Mag.Component("i18n"),
        langSelector: new Mag.Component("langSelector"),
    },
};

export const init = (): void => {
    state.UI.queries.mobile.subscribe("menu", {
        next: (matches) => state.UI.media.isMobile.update(matches),
    });

    const changeLangEvent = (lang: string) =>
        new CustomEvent("i18n_update", { detail: lang });

    state.components.langSelector.onEventLocal("click", (node) => {
        const lang = node.getAttribute("data-mag-i18n-lang");
        if (lang) {
            window.dispatchEvent(changeLangEvent(lang));
        }
        return node;
    });

    state.components.i18n.onEventGlobal(
        "i18n_update",
        (node: HTMLElement, payload: CustomEvent<keyof typeof langs>) => {
            const i18n_key = node.id.slice(2);
            const lang = payload.detail;
            node.innerHTML = langs[lang][i18n_key];
            return node;
        }
    );
};

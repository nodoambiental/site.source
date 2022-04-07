import * as ZT from "ziptied";
import i18n_en from "../data/i18n/en.json";
import i18n_es from "../data/i18n/es.json";

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
            isMobile: new ZT.State(false),
        },
        queries: {
            load: new ZT.Events.ActiveEvent<boolean>("load", (event) => true),
            mobile: new ZT.Events.WidthQuery(768),
        },
        lang: new ZT.State("en"),
        availableLangs: langs,
    },
    data: {},
    nodes: {
        potato: new ZT.Node("potato"),
    },
    components: {
        i18n: new ZT.Component("i18n", (node, payload) => {
            node.dataset.ztI18nKey = node.innerText;
            return node;
        }),
        langSelector: new ZT.Component("langSelector"),
    },
};

interface StatefulWindow extends Window {
    state: typeof state;
}

export const init = (): void => {
    state.UI.queries.mobile.subscribe("menu", {
        next: (matches) => state.UI.media.isMobile.update(matches),
    });

    state.components.langSelector.onEventLocal("click", (node) => {
        const lang = node.getAttribute("data-zt-i18n-lang");
        if (lang) {
            console.info(`updated lang to ${lang}`);
            (window as unknown as StatefulWindow).state.UI.lang.update(lang);
        }
        return node;
    });
    state.components.i18n.addSideEffect(
        "i18n_update",
        (node: HTMLElement, lang: keyof typeof langs) => {
            console.info("fired i18n_update effect");
            node.innerText = (
                window as unknown as StatefulWindow
            ).state.UI.availableLangs[lang][node.dataset.ztI18nKey];
            return node;
        },
        state.UI.lang
    );
};

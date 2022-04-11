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
    },
    data: {},
    nodes: {
        potato: new ZT.Node("potato"),
    },
    components: {
        i18n: new ZT.TextReplacerTarget(
            "i18n",
            {
                selected: "en",
                corpus: langs,
            },
            "Updated internazionalization target."
        ),
    },
};

interface StatefulWindow extends Window {
    state: typeof state;
}

export const init = (): void => {
    Object.assign((window as unknown as StatefulWindow).state.components, {
        langSelector: new ZT.TextReplacerSelector(
            "langSelector",
            "data-zt-i18n-lang",
            "click",
            state.components.i18n,
            "Updated language."
        ),
    });

    state.UI.queries.mobile.subscribe("menu", {
        next: (matches) => state.UI.media.isMobile.update(matches),
    });
};

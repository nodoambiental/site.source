module.exports = {
    content: ["./src/**/*.{js,pug}"],
    theme: {
        extend: {},
    },
    plugins: [require("daisyui")],
    daisyUi: {
        themes: true,
        styled: true,
        base: true,
        utils: true,
    },
};

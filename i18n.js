export default {
  // ...rest of config
  "loadLocaleFrom": (lang, ns) =>
    // You can use a dynamic import, fetch, whatever. You should
    // return a Promise with the JSON file.
    import(`./myTranslationsFiles/${lang}/${ns}.json`).then((m) => m.default),
}


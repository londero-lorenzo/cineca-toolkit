javascript:(() => {
    const bundleUrl = "https://cdn.jsdelivr.net/gh/londero-lorenzo/cineca-toolkit@main/dist/bookmarklet.min.js";

    const script = document.createElement("script");
    // jsDelivr caches branch URLs aggressively; bust the cache while iterating on main
    script.src = `${bundleUrl}?t=${Date.now()}`;
    document.body.appendChild(script);
})();

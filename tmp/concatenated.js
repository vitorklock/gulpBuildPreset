var ltkModal;
document.addEventListener("DOMContentLoaded", function () {
    const getScript = function (url) {
        return new Promise(function (resolve, reject) {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onerror = reject;
            script.onload = script.onreadystatechange = function () {
                const loadState = this.readyState;
                if (loadState && loadState !== 'loaded' && loadState !== 'complete') return
                script.onload = script.onreadystatechange = null;
                resolve();
            };
            document.head.appendChild(script);
        });
    };
    fetch("https://dev-leadstaker.netlify.app/static/embed.json")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            var conditions = [];
            conditions = data.refusals;
            for (var condition of conditions) {
                if ((new Function("return " + condition))()) {
                    console.error("Ltk will not embbed, see why: LINK");
                    return false;
                }
            };
            getScript("https://chat-v2.leadstaker.com.br/ltkScript.min.js").then(function () {
                ltkModal = new Ltk(); ltkModal.init("ID DO FLUXO");
            });
        });
});
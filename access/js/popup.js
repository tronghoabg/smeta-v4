init()
async function init() {
    var sMeta = false
    var tabs = await chrome.tabs.query({});

    tabs.forEach(function (tab) {
        if (tab.title.indexOf('sMeta.vn!') > -1) {
            console.log(tab)
            sMeta = true
            chrome.windows.update(tab.windowId, {}, (window) => {
                console.log(window.focused)
                if(!window.focused){
                    chrome.windows.update(tab.windowId, {focused: true}, (window) => {
                        chrome.tabs.update(tab.id, {active: true})
                      })
                } 
              })
            window.close()
        }
    });

    if (!sMeta) {
        chrome.windows.create({ 'url': 'https://smeta.vn/app', 'type': 'popup', height: 600, width: 1200, top: 200, left: 200 }, function (window) {
        });
        window.close()
    }
}

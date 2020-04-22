"use strict";

const requestFilter = {
    urls: ["https://*.twitter.com/*"]
};

const extraInfoSpec = ['requestHeaders', 'blocking'];
// Chrome will call your listener function in response to every
// HTTP request
const handler = function (details) {

    let headers = details.requestHeaders;
    let blockingResponse = {};
    const l = headers.length;
    for (let i = 0; i < l; ++i) {
        if (headers[i].name === 'User-Agent') {
            headers[i].value = 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) Waterfox/56.2';
            break;
        }
    }

    blockingResponse.requestHeaders = headers;
    return blockingResponse;
};

function removeCookie() {
    chrome.browsingData.remove({"origins": ["https://twitter.com"]}, {"cacheStorage": true, "cache": true});
    chrome.tabs.query({url: "*://*.twitter.com/*"}, function (result) {
        result.forEach(function (tab) {
            chrome.tabs.reload(tab.id)
        })
    });
}

chrome.webRequest.onBeforeSendHeaders.addListener(handler, requestFilter, extraInfoSpec);
chrome.runtime.onInstalled.addListener(removeCookie);

// One-time reset of settings
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') { 
      chrome.tabs.create({ url: 'https://twitter.com' });
    }
    else if (details.reason === 'update' && /^(((0|1)\..*)|(2\.(0|1)(\..*)?))$/.test(details.previousVersion)) { 
      ls.clear();
    }
});
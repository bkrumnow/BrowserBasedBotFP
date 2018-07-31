/**********************************************************
 * utils.js
 * Contains general functions to aid the abstraction of the browser fingerprint
 *
 * License 2018 Open Source License
 * Written By: Gabry Vlot (https://github.com/GabryVlot)
 * Project: Detecting Web bot Detecting | Fingerprinting (https://github.com/GabryVlot/BrowserBasedBotFP)
 **********************************************************/

//Parses the contents of a DOM node to a JSON Object
function toJSON(node) {
    if (!node)
        return {};

    var JSONObject = {
        nodeType: node.nodeType
    };
    if (node.tagName) {
        JSONObject.tagName = node.tagName.toLowerCase();
    }
    else if (node.nodeName) {
        JSONObject.nodeName = node.nodeName;
    }
    if (node.nodeValue) {
        JSONObject.nodeValue = node.nodeValue;
    }
    var attrs = node.attributes;
    if (attrs) {
        var length = attrs.length;
        var arr = JSONObject.attributes = new Array(length);
        for (var i = 0; i < length; i++) {
            attr = attrs[i];
            arr[i] = [attr.nodeName, attr.nodeValue];
        }
    }
    var childNodes = node.childNodes;
    if (childNodes) {
        length = childNodes.length;
        arr = JSONObject.childNodes = new Array(length);
        for (i = 0; i < length; i++) {
            arr[i] = toJSON(childNodes[i]);
        }
    }
    return JSONObject;
}

//extracts the properties of a JavaScript object
function getObjectProperties(browserObject){
    const keys = [];
    for (var w in browserObject){ keys.push(w);}
    return keys;
}

//Function that will construct the parameter that will be send to the WebServer containing all FP data
function constructFPParam(configuration, navigator, fingerPrint, result, components){
    const params = {
        "hash": result,
        "fp2": components,
        "configuration": configuration,
        "browser": {
            window: fingerPrint.windowKeys,
            missingBindFunction: fingerPrint.lackOfJavaScriptEngineFeatures,
            stackTrace: fingerPrint.stackTrace,
            webSecurity: fingerPrint.hasWebSecurity,
            autoClosePopup: fingerPrint.autoCloseAlert,
            missingImage: fingerPrint.missingImage
        },
        "navigator": {
            mimeTypes: fingerPrint.mimeTypes,
            navigator: JSON.stringify(fingerPrint.navigator),
            language: navigator.language,
            languages: navigator.languages,
            webSocket: fingerPrint.webSocket
        },
        "document": {
            docKeys: fingerPrint.docKeys,
            documentElement: toJSON(document.documentElement || this)
        }
    }
    return params;
}
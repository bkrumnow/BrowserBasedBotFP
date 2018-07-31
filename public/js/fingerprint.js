/**********************************************************
 * finterprint.js
 * Extracts browser fingerprint from Global DOM objects
 *
 * License 2018 Open Source License
 * Written By: Gabry Vlot (https://github.com/GabryVlot)
 * Project: Detecting Web bot Detecting | Fingerprinting (https://github.com/GabryVlot/BrowserBasedBotFP)
 **********************************************************/

//Collect the browser sensitive information from the global DOM objects by the best practises
//Shared across the internet:
//https://blog.shapesecurity.com/2015/01/22/detecting-phantomjs-based-visitors/
//https://www.slideshare.net/SergeyShekyan/shekyan-zhang-owasp
//https://stackoverflow.com/questions/20862728/reliably-detecting-phantomjs-based-spam-bots
//https://news.ycombinator.com/item?id=8901117
const getBrowserFingerprint = function(document, window, navigator, cb){
    missingImage(document, function(missingImage){
        const returnValue = {
            mimeTypes: mimeTypes(navigator),
            missingImage : missingImage,
            lackOfJavaScriptEngineFeatures : lackOfJavaScriptEngineFeatures(),
            autoCloseAlert : autoCloseAlert(),
            stackTrace : stackTrace(),
            hasWebSecurity : hasWebSecurity(window),
            windowKeys : getObjectProperties(window),
            docKeys : getObjectProperties(document),
            navigator: getGlobalDOMNavigatorObjectProperties(navigator),
            webSocket : webSocket(navigator)
        }
        cb(returnValue);
    });
}

function mimeTypes(navigator){
    var types = [];
    if (navigator.mimeTypes){
        for(var i=0;i<navigator.mimeTypes.length;i++){
            const mimeType = navigator.mimeTypes[i];
            types.push(mimeType.type);
        }
    }
    return types.length > 0 ? types.join(',') : '';
}

function webSocket(navigator){
    var returnValues = [];
    try{
        const ws = new window.WebSocket('ws://localhost:8080')
        if (ws){
            for(field in ws){
                const fieldValue = ws[field];
                returnValues.push(field + ':' + fieldValue);
            }
        }
    }catch(e){}
    return returnValues.length > 0 ? returnValues.join(',') : 'Not able to instantiate'
}

//Check for the loading abillity of images in respect to headless browsers
function missingImage(document, cb){
    const body = document.getElementsByTagName("body")[0];
    var image = document.createElement("img");
    image.src = "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";
    image.setAttribute("id", "fakeimage");
    body.appendChild(image);
    image.onerror = function(e){
        if(image.width == 0 && image.height == 0) {
            return cb(true);
        }
        cb(false);
    }
}

//Checks the spoofing of javaScript engine feateures
function lackOfJavaScriptEngineFeatures(){
    return (function () {
        if (!Function.prototype.bind) {
            return true;
        }
        if (Function.prototype.bind.toString().replace(/bind/g, 'Error') != Error.toString()) {
            return true;
        }
        if (Function.prototype.toString.toString().replace(/toString/g, 'Error') != Error.toString()) {
            return true;
        }
        return false;
    })();
}

//checks autoclose function. Closing of an Alert within 15 milliseconds indicates a web bot
function autoCloseAlert(){
    var start = Date.now();
    alert('Press OK');
    var elapse = Date.now() - start;
    return elapse < 15 ? true : false
}

//Raises an exception to capture the exception (Web bot seems to have a different stack trace)
function stackTrace(){
    var err;
    try {
        null[0]();
    } catch (e) {
        err = e;
    }
    return err.stack;
}

//Websecurity is often bypassed by web bots
function hasWebSecurity(window){
    var xhr;
    if (window.XMLHttpRequest)
        xhr = new XMLHttpRequest();
    else
        xhr = new window.ActiveXObject("Microsoft.XMLHTTP");

    try {
        xhr.open('GET', 'file:/etc/hosts, false');
    }catch(e){ //I.e. 11
        return true;
    }

    try{
        xhr.send();
    }
    catch(e){
        return false;
    }
    return true;
}

function getGlobalDOMNavigatorObjectProperties(navigator){
    var _navigator = {};
    for (var i in navigator) _navigator[i] = navigator[i];

    delete _navigator.plugins;
    delete _navigator.mimeTypes;
    delete _navigator.language;
    delete _navigator.languages;
    return _navigator;
}
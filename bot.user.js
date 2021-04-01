// ==UserScript==
// @name         SecondBot
// @namespace    https://dimden.dev/
// @version      1.0
// @description  Tried to guess the second one
// @author       dimden
// @match        https://second-api.reddit.com/embed?platform=desktop&nightmode=1
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

unsafeWindow.ws = undefined;
const nativeWebSocket = unsafeWindow.WebSocket;
unsafeWindow.WebSocket = function(...args){
  const socket = new nativeWebSocket(...args);
  unsafeWindow.ws = socket;
  onConnection(socket);
  return socket;
};

function onConnection(socket) {
    console.log("CONNECTED!", socket);
    let ws = unsafeWindow.ws;
    setTimeout(() => {
        let realonmsg = ws.onmessage;
        ws.onmessage = msg => {
            onMessage(JSON.parse(msg.data).data);
            realonmsg(msg);
        }
    }, 500);
};

let startGathering = false;
let imgdata = [];
let prevSeconds = -1;
function onMessage(msg) {
    msg = msg.current_round;
    // console.log(msg);
    if(msg.winDelta === 6 && msg.secondsUntilVoteReveal === 0) {
        startGathering = true;
        imgdata = msg.images;
    }
    if(msg.winDelta === 6 && msg.secondsUntilVoteReveal !== 0 && prevSeconds === 0) {
        // make decision
        // console.log("imgs", imgdata);
        let j = 1;
        imgdata.forEach(i => i.index = (j++));
        let sorted = imgdata.sort((a, b) => a.votes-b.votes);
        console.log(`VOTE: ${sorted[1].index}`);
        unsafeWindow.document
            .querySelector("*[currentround^='{']")
            .shadowRoot
            .children[0]
            .querySelector("#wrapper")
            .querySelector("afd2021-round")
            .shadowRoot
            .querySelector("faceplate-form")
            .querySelector("fieldset")
            .children[sorted[1].index-1]
            .click();
    }

    prevSeconds = msg.secondsUntilVoteReveal;
}

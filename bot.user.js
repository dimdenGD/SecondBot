// ==UserScript==
// @name         SecondBot
// @namespace    https://dimden.dev/
// @version      1.1
// @description  Tried to guess the second one
// @author       dimden
// @match        https://second-api.reddit.com/embed?platform=desktop&nightmode=1
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
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

let imgdata = [];
let prevSeconds = -1;
let shouldGet = true;
async function onMessage(msg) {
    msg = msg.current_round;
    if(msg.winDelta === 9 && shouldGet) {
        shouldGet = false;
        imgdata = msg.images;
        let [i1, i2, i3] = [await gid(imgdata[0].id), await gid(imgdata[1].id), await gid(imgdata[2].id)];
        console.log(i1, i2, i3);
        let arr = [
            {
                img: imgdata[0],
                votes: i1
            },
            {
                img: imgdata[1],
                votes: i2
            },
            {
                img: imgdata[2],
                votes: i3
            }
        ];

        // make decision
        let j = 1;
        arr.forEach(i => i.index = (j++));
        let sorted = arr.sort((a, b) => b.votes-a.votes);
        // console.log(sorted, await getImageData(sorted[1].id));
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
    if(msg.winDelta === 6 && msg.secondsUntilVoteReveal === 0) {
        shouldGet = true;
        imgdata = msg.images;
    }

    prevSeconds = msg.secondsUntilVoteReveal;
}

async function gid(id) {
    let req = await fetch(`https://cors-anywhere.dimden.dev/https://spacescience.tech/ratio.php?id=${id}`);
    let json = await req.json();
    return json.map(i => +i.votes).slice(-10).reduce((a, b) => a + b, 0)/json.slice(-10).length;
}

setTimeout(() => {location.reload()}, 60000*10);

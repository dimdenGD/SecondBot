// ==UserScript==
// @name         SecondBot
// @namespace    https://dimden.dev/
// @version      1.2
// @description  Tries to guess the second one
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
    startOverlay();
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
let ended = false;
let sii = undefined;

function onMessage(msg) {
    if(msg.previous_round && !ended && msg.previous_round.winnerImageId) {
        // result
        ended = true;
        if(msg.previous_round.winnerImageId === sii) {
            wins++;
            score += 6;
        } else {
            loses++;
            score -= 2;
        }
        updateOverlay({
            wins,
            loses,
            score,
            ratio: ((1-(loses)/(wins+loses))*100).toFixed(2),
        })
    }
    msg = msg.current_round;
    // console.log(msg);
    if(msg.winDelta === 6 && msg.secondsUntilVoteReveal === 0) {
        startGathering = true;
        imgdata = msg.images;
        ended = false;
    }
    if(msg.winDelta === 6 && msg.secondsUntilVoteReveal !== 0 && prevSeconds === 0) {
        // make decision
        // console.log("imgs", imgdata);
        let j = 1;
        imgdata.forEach(i => i.index = (j++));
        let sorted = imgdata.sort((a, b) => a.votes-b.votes);
        let index = unsafeWindow.how2vote === 1 ? 1 : unsafeWindow.how2vote === 2 ? 2 : (Math.random() < 0.5 ? 1 : 2)
        console.log(`VOTE: ${sorted[index].index}`);
        sii = sorted[index].id;
        unsafeWindow.document
            .querySelector("*[currentround^='{']")
            .shadowRoot
            .children[0]
            .querySelector("#wrapper")
            .querySelector("afd2021-round")
            .shadowRoot
            .querySelector("faceplate-form")
            .querySelector("fieldset")
            .children[sorted[index].index-1]
            .click();
    }

    prevSeconds = msg.secondsUntilVoteReveal;
}

let wins = 0;
let loses = 0;
let score = 0;
let start = Date.now();
unsafeWindow.how2vote = 1; // 1 - select 2nd, 2 - select 1st, 3 - random

function updateOverlay(obj) {
    if(obj.wins) document.getElementById("sb-wins").innerText = obj.wins;
    if(obj.loses) document.getElementById("sb-loses").innerText = obj.loses;
    if(obj.ratio) document.getElementById("sb-ratio").innerText = obj.ratio;
    if(obj.score) document.getElementById("sb-score").innerText = obj.score;
}

function startOverlay() {
    document.querySelector("*[aria-live='polite']").hidden = true;
    document.body.insertAdjacentHTML("beforeend", `
<style>
#sb-overlay {
position: fixed;
left: 10px;
bottom: 10px;
font-family: sans-serif;
}
</style>
<div id="sb-overlay">
<h3>SecondBot by <a href="https://dimden.dev/">dimden</a></h3>
<select id="how2vote" onchange="how2vote = this.value === '2nd' ? 1 : this.value === '1st' ? 2 : 3">
<option>2nd</option>
<option>1st</option>
<option>Random</option>
</select><br>
Wins: <span id="sb-wins">0</span><br>
Loses: <span id="sb-loses">0</span><br>
W/L Ratio: <span id="sb-ratio">?.??</span>%<br>
Score since load: <span id="sb-score">0</span><br>
</div>`);
}

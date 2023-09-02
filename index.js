// ==UserScript==
// @name         我的脚本
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       梅一一
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==
(function () {
  "use strict";
  document.addEventListener("keydown", FullScreen());
  document.addEventListener("keydown", EnableCopy());
  window.addEventListener("load", reloadPage);
})();

function reloadPage() {
  if (location.protocol === "file:") {
    !location.hash && (location.hash += "#view=FitH,top");
    if (!location.hash.includes("#view=FitH,top")) location.reload();
  }
  deleteAds();
  isBilibiliVideoPlaying();
}

function deleteAds() {
  const ele = document.querySelector(".ruochuan12-side");
  if (ele) ele.remove();
}

function FullScreen() {
  let passKey = [];
  let timer;
  let keyword = ["Z", "X", "SHIFT"];

  return function (_a) {
    const key = "".toLocaleUpperCase.call(_a.key);
    if (keyword.includes(key)) {
      passKey.push(key);
      if (keyword.every((key) => passKey.includes(key))) {
        document.documentElement.requestFullscreen();
      }
      clearTimeout(timer);
      timer = setTimeout(function () {
        passKey.length = 0;
      }, 1000);
    }
  };
}

function EnableCopy() {
  let passKey = [];
  let timer;
  let keyword = ["C", "C", "V"];
  let removeKey = ["SHIFT", "SHIFT", "ALT"];
  let isEditing = false;

  return function (_a) {
    const key = "".toLocaleUpperCase.call(_a.key);
    if (keyword.includes(key) || removeKey.includes(key)) {
      passKey.push(key);
      if (isEntry(keyword)) {
        document.body.contentEditable = true;
        isEditing = true;
        alert("开始复制");
      }

      if (isEditing && isEntry(removeKey)) {
        document.body.contentEditable = false;
        isEditing = false;
        alert("结束");
      }

      clearTimeout(timer);
      timer = setTimeout(function () {
        passKey.length = 0;
      }, 1000);
    }
  };

  function isEntry(keyword = []) {
    if (passKey.length < 3) return false;
    return keyword.every((key) => {
      const index = passKey.findIndex((k) => key === k);
      if (index === -1) return false;
      else {
        passKey.splice(index, 1);
        return true;
      }
    });
  }
}

function isBilibiliVideoPlaying() {
  requestIdleCallback(() => {
    const t = document.querySelector("video");
    if (t) {
      document.documentElement.addEventListener("keydown", (ev) => {
        if (ev.ctrlKey) {
          const item = document.querySelector("video");
          switch (ev.key) {
            case "ArrowUp":
              item.playbackRate = (item.playbackRate + 0.1).toFixed(2);
              break;
            case "ArrowDown":
              item.playbackRate = (item.playbackRate - 0.1).toFixed(2);
              break;
            default:
              break;
          }
        }
      });
      return;
    }
    isBilibiliVideoPlaying();
  });
}

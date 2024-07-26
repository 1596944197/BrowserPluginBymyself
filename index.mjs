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
  document.addEventListener("keydown", toggleYoTubeVideoControl());
  window.addEventListener("load", reloadPage);
})();

function reloadPage() {
  FullScreenPDF();
  deleteAds();
  isBilibiliVideoPlaying();
  isBilibiliVideoPlaying.loadHandle();
  nodeSeekAutoCheckIn();
  WuAiPoJieAutoLogin();
}

function FullScreenPDF() {
  if (location.protocol === "file:") {
    if (!location.hash) {
      location.hash += "#view=FitH,top";
      setTimeout(() => {
        location.reload();
      }, 1000);
    }
  }
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
    if (!_a?.key) return;
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
    if (!_a?.key) return;
    const key = "".toLocaleUpperCase.call(_a.key);
    if ((keyword.includes(key) || removeKey.includes(key)) && _a.ctrlKey) {
      passKey.push(key);
      if (isEntry(keyword)) {
        document.body.contentEditable = true;
        isEditing = true;
        console.log("开始复制");
      }

      if (isEditing && isEntry(removeKey)) {
        document.body.contentEditable = false;
        isEditing = false;
        console.log("结束");
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
    const classList = [".bpx-player-control-wrap", "video"];
    const t = classList.find((cla) => document.querySelector(cla));
    if (t) {
      document.documentElement.removeEventListener(
        "keydown",
        isBilibiliVideoPlaying.handle
      );
      document.documentElement.addEventListener(
        "keydown",
        isBilibiliVideoPlaying.handle
      );
      return;
    }
    isBilibiliVideoPlaying();
  });
}

isBilibiliVideoPlaying.key = "_videoRate";
isBilibiliVideoPlaying.handle = function handle(ev) {
  const key = isBilibiliVideoPlaying.key;
  if (ev.ctrlKey && ["ArrowUp", "ArrowDown"].includes(ev.key)) {
    const currentVideo = getLargestVisibleVideo();
    if (!currentVideo) return;

    let rate = +(localStorage.getItem(key) || 1);
    let title = "";

    switch (ev.key) {
      case "ArrowUp":
        title = `速度增加`;
        rate = (rate + 0.1).toFixed(2);
        localStorage.setItem(key, rate);
        break;
      case "ArrowDown":
        title = `速度减少`;
        rate = (rate - 0.1).toFixed(2);
        localStorage.setItem(key, rate);
        break;
      default:
        break;
    }

    currentVideo.playbackRate = rate;

    chrome.runtime.sendMessage(
      {
        type: "change-play-rate",
        data: {
          title,
          message: localStorage.getItem(key),
        },
      },
      (res) => {
        console.log(res);
      }
    );
  }
};
isBilibiliVideoPlaying.loadHandle = function loadHandle() {
  const playbackRate = +localStorage.getItem(isBilibiliVideoPlaying.key) || 1;

  const Set = new WeakSet();
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (
            node.tagName === "VIDEO" &&
            node instanceof HTMLVideoElement &&
            !Set.has(node)
          ) {
            handleVideo(node, Set);
          }
        });
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.querySelectorAll("video").forEach(handleVideo);

  /**
   * @param {HTMLVideoElement} node
   * @param {WeakSet<object>} set
   */
  function handleVideo(node, set) {
    if (node._isHandle) return;

    // 使用一次性事件监听器
    node.addEventListener("loadedmetadata", function onLoadedMetadata() {
      node.playbackRate = playbackRate;
      // 移除事件监听器
    });

    node._isHandle = true;
    set.add(node);
  }
};

function toggleYoTubeVideoControl() {
  // 检测ctrl + v
  let isShow = true;
  let timer = null;
  return function l(_a) {
    if (!_a?.key) return;
    const key = "".toLocaleUpperCase.call(_a.key);
    if (key === "V" && _a.ctrlKey) {
      const videoControl = document.querySelector(".ytp-chrome-bottom");
      if (!videoControl) return;
      const subButton = document.querySelector(".iv-branding");
      if (subButton) subButton.style.display = isShow ? "none" : "block";

      const container = document.querySelector(
        "#container .html5-video-player"
      );
      // 给container填入事件，当鼠标移入到container时，对subtitle进行操作
      container.onmouseover = changeSubtitleMargin;

      videoControl.style.display = isShow ? "none" : "block";
      isShow = !isShow;
    }
  };

  function changeSubtitleMargin() {
    if (!isShow) {
      const subtitle = document.querySelectorAll(".caption-window");
      subtitle.forEach((item) => {
        // 查看元素的margin-bottom 是否为0px，如果不是则设置为0px
        const marginBottom = item.style.getPropertyValue("margin-bottom");
        if (marginBottom !== "0px") {
          item.style.setProperty("margin-bottom", "0px", "important");
        }
      });
      clearTimeout(timer);
      timer = setTimeout(() => {
        changeSubtitleMargin();
      }, 16);
    }
  }
}

async function nodeSeekAutoCheckIn() {
  const current = new Date().toLocaleDateString("zh-CN");
  const key = "_checkedDays";
  if (location.href.includes("nodeseek.com")) {
    if (localStorage.getItem(key) === current) return;
    setTimeout(async () => {
      await fetch("/api/attendance?random=true", { method: "post" });
      localStorage.setItem(key, current);
    }, 1000);
  }
}

function WuAiPoJieAutoLogin() {
  const date = new Date().toLocaleDateString("zh-CN").replaceAll("/", "-");
  if (
    location.href.includes("52pojie") &&
    localStorage.getItem("_wuAiPoJieAutoLogin") !== date
  ) {
    const loginBtn = document.querySelector(
      `a[href*="home.php?mod=task&do=apply&"] img`
    );
    if (loginBtn) {
      loginBtn.click();
      // 格式化时间为2023-01-01
      localStorage.setItem("_wuAiPoJieAutoLogin", date);
    }
  }
}

/** @returns {HTMLVideoElement} */
function getLargestVisibleVideo() {
  const videos = document.querySelectorAll("video");
  let largestVideo = null;
  let largestArea = 0;

  videos.forEach((video) => {
    const rect = video.getBoundingClientRect();
    const width = Math.max(
      0,
      Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left)
    );
    const height = Math.max(
      0,
      Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top)
    );
    const area = width * height;

    if (area > largestArea) {
      largestArea = area;
      largestVideo = video;
    }
  });

  return largestVideo;
}

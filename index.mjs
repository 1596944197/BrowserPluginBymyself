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
  // updateScrollbarGradient();
  startWatchScroll();
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
    // 检测是否为Mac系统
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const controlKey = isMac ? _a.metaKey : _a.ctrlKey;

    if ((keyword.includes(key) || removeKey.includes(key)) && controlKey) {
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
  // 检测是否为Mac系统
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const controlKey = isMac ? ev.shiftKey : ev.ctrlKey;

  if (controlKey && ["ArrowUp", "ArrowDown"].includes(ev.key)) {
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
  const playbackRate = {
    get value() {
      return +localStorage.getItem(isBilibiliVideoPlaying.key) || 1;
    },
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === "VIDEO" && node instanceof HTMLVideoElement) {
            handleVideo(node);
          }
        });
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.querySelectorAll("video").forEach((ev) => handleVideo(ev));

  /**
   * @param {HTMLVideoElement} node
   */
  function handleVideo(node) {
    if (node.playbackRate === playbackRate.value) return;

    const VIDEO_EVENTS = [
      "loadedmetadata", // 当视频的元数据加载完成时触发
      "canplay", // 当视频可以开始播放时触发
      "play", // 当视频开始播放时触发
      "playing", // 当视频正在播放时触发
      "ratechange", // 当播放速率改变时触发
    ];

    function _handle() {
      requestIdleCallback(() => {
        node.playbackRate = playbackRate.value;
      });
    }
    VIDEO_EVENTS.forEach((event) => {
      node.addEventListener(event, _handle);
    });
  }
};

function toggleYoTubeVideoControl() {
  // 检测ctrl + v
  let isShow = true;
  let timer = null;
  return function l(_a) {
    if (!_a?.key) return;
    const key = "".toLocaleUpperCase.call(_a.key);
    // 检测是否为Mac系统
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const controlKey = isMac ? _a.metaKey : _a.ctrlKey;

    if (key === "V" && controlKey) {
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

// function getRandomColor() {
//   const r = Math.floor(Math.random() * 230); // 限制红色值
//   const g = Math.floor(Math.random() * 230); // 限制绿色值
//   const b = Math.floor(Math.random() * 230); // 限制蓝色值
//   return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
// }

// function getRandomGradient() {
//   // 线性渐变
//   return `linear-gradient(${getRandomColor()} 0%,${getRandomColor()} 100%`;
// }

// function updateScrollbarGradient(thumbGradient, hoverGradient) {
//   thumbGradient &&
//     document.documentElement.style.setProperty(
//       "--ff-scrollbar-thumb-background",
//       thumbGradient
//     );
//   hoverGradient &&
//     document.documentElement.style.setProperty(
//       "--ff-scrollbar-thumb-hover-background",
//       hoverGradient
//     );
// }

// function applySavedColors() {
//   const url = window.location.origin;
//   chrome.storage.sync.get(url, (data) => {
//     if (data[url]) {
//       const { thumbColor, hoverColor } = data[url];
//       updateScrollbarGradient(thumbColor, hoverColor);
//     } else {
//       const thumbGradient = getRandomGradient();
//       const hoverGradient = getRandomGradient();
//       updateScrollbarGradient(thumbGradient, hoverGradient);
//     }
//   });
// }

// applySavedColors();

const state = new Map();
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // if (request.action === "getCurrentColors") {
  //   const thumbColor = getComputedStyle(
  //     document.documentElement
  //   ).getPropertyValue("--ff-scrollbar-thumb-background");
  //   const hoverColor = getComputedStyle(
  //     document.documentElement
  //   ).getPropertyValue("--ff-scrollbar-thumb-hover-background");
  //   sendResponse({ thumbColor, hoverColor });
  // } else if (request.action === "randomizeColors") {
  //   const thumbGradient = getRandomGradient();
  //   const hoverGradient = getRandomGradient();
  //   updateScrollbarGradient(thumbGradient, hoverGradient);
  // }
  if (request.action === "toggle-scroll") {
    if (state.get(sender.id) === "running") {
      state.set(sender.id, "paused");
      triggerKeyEvent("≈");
    } else {
      state.set(sender.id, "running");
      triggerKeyEvent("ß");
    }
  }
  if (request.action === "scroll-capture") {
    scrollAndCapture();
  }
});

let scrollContainer = document.documentElement; // 默认使用html元素
function startWatchScroll() {
  let scrollRequestId;
  let isScrolling = false;
  let frameCount = 0;
  let currentSpeed = 0.5;
  let lastDirection = 1;
  const speedIncrement = 0.5;
  const maxSpeed = 10;

  function startAutoScroll(direction = 1) {
    scrollContainer = detectScrollContainer(); // 每次开始前重新检测

    if (direction !== lastDirection) {
      stopAutoScroll();
    }
    isScrolling = true;
    currentSpeed = Math.min(currentSpeed + speedIncrement, maxSpeed);
    scrollLoop(direction);
  }

  function scrollLoop(direction) {
    if (isScrolling) {
      scrollRequestId = requestAnimationFrame(() => {
        frameCount++;

        if (frameCount >= 3) {
          const movement = direction * currentSpeed;
          if (direction !== lastDirection) {
            currentSpeed = 1;
            lastDirection = direction;
          }

          // 使用检测到的滚动容器
          scrollContainer.scrollTop += movement;

          frameCount = 0;
        }

        // 检查是否到达边界
        if (
          (direction === 1 &&
            scrollContainer.scrollTop >=
              scrollContainer.scrollHeight - scrollContainer.clientHeight) ||
          (direction === -1 && scrollContainer.scrollTop <= 0)
        ) {
          stopAutoScroll();
        }

        scrollLoop(direction);
      });
    }
  }

  function stopAutoScroll() {
    if (isScrolling) {
      cancelAnimationFrame(scrollRequestId);
      isScrolling = false;
      currentSpeed = 1;
      frameCount = 0;
    }
  }

  document.addEventListener("keydown", (event) => {
    switch (event.key?.toLowerCase?.()) {
      case "ß":
        event.preventDefault();
        startAutoScroll(1);
        break;
      case "∑":
        event.preventDefault();
        startAutoScroll(-1);
        break;
      case "≈":
        event.preventDefault();
        stopAutoScroll();
        currentSpeed = 1;
        break;
    }
  });
}

// 检测实际的滚动容器
function detectScrollContainer() {
  // 检查documentElement是否可以滚动
  if (
    document.documentElement.scrollHeight >
    document.documentElement.clientHeight
  ) {
    return document.documentElement;
  }
  // 检查body是否可以滚动
  if (document.body.scrollHeight > document.body.clientHeight) {
    return document.body;
  }
  // 检查其他可能包含滚动的元素
  const scrollableElements = document.querySelectorAll("*");
  for (let el of scrollableElements) {
    if (
      el.scrollHeight > el.clientHeight &&
      getComputedStyle(el).overflowY === "auto"
    ) {
      return el;
    }
  }
  return document.documentElement; // 默认返回html元素
}

function triggerKeyEvent(keyValue) {
  const event = new KeyboardEvent("keydown", {
    key: keyValue,
    bubbles: true, // 确保事件冒泡
    cancelable: true, // 如果需要可以被取消
  });

  document.dispatchEvent(event);
}

async function scrollAndCapture() {
  const container = detectScrollContainer();
  const totalHeight = container.scrollHeight;
  const viewHeight = container.clientHeight;
  let scrollTop = 0;
  let shots = [];

  while (scrollTop < totalHeight) {
    container.scrollTop = scrollTop;
    await new Promise((r) => setTimeout(r, 500)); // 等渲染
    const { dataUrl } = await new Promise((r) =>
      chrome.runtime.sendMessage({ type: "capture-visible" }, r)
    );
    shots.push({ scrollTop, dataUrl });
    scrollTop += viewHeight * 0.9;
  }

  if (!shots.every((shot) => shot.dataUrl.includes("data:image/png"))) {
    alert("截图失败");
    return;
  }

  // 拼接
  const canvas = document.createElement("canvas");
  canvas.width = container.clientWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");
  for (const shot of shots) {
    const img = new Image();
    img.src = shot.dataUrl;
    // eslint-disable-next-line no-await-in-loop
    await img.decode();
    ctx.drawImage(img, 0, shot.scrollTop);
  }
  // 下载
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `${location.host}.png`;
  a.click();
}

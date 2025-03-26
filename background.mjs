const ttsReadKey = "ttsReadKey";

const switchLeftTab = "switch-left-tab";

const switchRightTab = "switch-right-tab";

const changePlayRate = "change-play-rate";

const toggleScroll = "toggle-scroll";

const requestHapi = "request-hapi";
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: ttsReadKey,
    title: "tts voice read",
    contexts: ["selection"],
  });
  // 创建个滚动的菜单
  chrome.contextMenus.create({
    id: toggleScroll,
    title: "开始滚动",
    contexts: ["page"],
  });
  // 请求Hapi服务,仅在bilibili.com下有效
  chrome.contextMenus.create({
    id: requestHapi,
    title: "请求Hapi服务",
    contexts: ["page"],
  });
});

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === changePlayRate) {
    handleNotification(req, sendResponse);
    return true;
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === switchLeftTab) {
    switchTab(-1); // 向左切换标签
  } else if (command === switchRightTab) {
    switchTab(1); // 向右切换标签
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === ttsReadKey) {
    function isChineseText(text) {
      const chineseRegex = /[\u4e00-\u9fa5]/;
      return chineseRegex.test(text);
    }
    chrome.tts.speak(info.selectionText, {
      lang: isChineseText(info.selectionText) ? "zh-CN" : "en-US",
    });
  }
  if (info.menuItemId === toggleScroll) {
    chrome.tabs.sendMessage(tab.id, {
      action: toggleScroll,
    });
  }
  if (info.menuItemId === requestHapi) {
    requestHapiHandle();
  }
});

// 用一个队列来存储通知
const notificationQueue = new Proxy([], {
  set(target, property, value, receiver) {
    // 触发默认的行为以确保值被正确设置
    Reflect.set(target, property, value, receiver);

    // 如果队列中新增了一个元素，并且当前没有正在处理的通知，则开始处理队列
    if (property == target.length - 1 && !notificationQueue.isProcessing) {
      processQueue();
    }
    return true;
  },
});

// 标志当前是否有通知处理函数在执行
notificationQueue.isProcessing = false;

/**
 * 处理队列中的下一个通知
 */
async function processQueue() {
  if (notificationQueue.length === 0) {
    notificationQueue.isProcessing = false;
    return;
  }

  notificationQueue.isProcessing = true;
  const handler = notificationQueue.shift();
  await handler?.();
  processQueue();
}

/**
 * 处理通知请求
 *
 * @param {*} req
 * @param {Function} sendResponse
 */
function handleNotification(req, sendResponse) {
  // 调用通知接口
  const notificationHandler = async () => {
    return new Promise((resolve) => {
      chrome.notifications.create(
        undefined,
        {
          type: "basic",
          iconUrl: "icon.png",
          title: req.data.title,
          message: req.data.message,
          silent: true,
        },
        (id) => {
          setTimeout(() => {
            chrome.notifications.clear(id);
            setTimeout(() => {
              resolve();
            }, 400);
          }, 800);
          sendResponse({ status: "success", message: "调整速度成功" });
        }
      );
    });
  };

  // 将通知处理函数添加到队列
  notificationQueue.push(notificationHandler);
}
function switchTab(direction) {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      let activeTabIndex = tabs.findIndex((tab) => tab.id === activeTabs[0].id);
      let newIndex = (activeTabIndex + direction + tabs.length) % tabs.length;
      chrome.tabs.update(tabs[newIndex].id, { active: true });
    });
  });
}

function requestHapiHandle() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = encodeURIComponent(tabs[0].url);
    const apiUrl = new URL(`http://127.0.0.1:39002/start-crawl/${url}`);

    fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      mode: "cors",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const text = await response.text();
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "请求成功",
          message: text,
        });
      })
      .catch((error) => {
        console.error("Error:", error);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "请求失败",
          message: "无法连接到本地服务器，请确保服务器已启动",
        });
      });
  });
}

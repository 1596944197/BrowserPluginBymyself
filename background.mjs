import {
  changePlayRate,
  switchLeftTab,
  switchRightTab,
  ttsReadKey,
} from "./constant.mjs";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: ttsReadKey,
    title: "tts voice read",
    contexts: ["selection"],
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
    chrome.tts.speak(info.selectionText);
  }
});

/**
 *
 * @param {*} req
 * @param {Function} sendResponse
 */
function handleNotification(req, sendResponse) {
  // 调用通知接口
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
      }, 1000);
      sendResponse({ status: "success", message: "调整速度成功" });
    }
  );
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

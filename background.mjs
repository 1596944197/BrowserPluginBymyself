chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === "GET_LOCAL_STORAGE") {
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
    return true;
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "switch-left-tab") {
    switchTab(-1); // 向左切换标签
  } else if (command === "switch-right-tab") {
    switchTab(1); // 向右切换标签
  }
});

function switchTab(direction) {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      let activeTabIndex = tabs.findIndex((tab) => tab.id === activeTabs[0].id);
      let newIndex = (activeTabIndex + direction + tabs.length) % tabs.length;
      chrome.tabs.update(tabs[newIndex].id, { active: true });
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.tts.speak(
    "hello guys, welcome to that, and if you want to see more info, you can search website url mh33.top."
  );
});

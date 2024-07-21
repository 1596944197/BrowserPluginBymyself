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
  if (req.type === "SWITCH_TAB") {
    (async () => {
      const tabs = await getAllTabs();
      const currentTabIndex = tabs.findIndex(
        (tab) => tab.active && tab.url === req.url
      );
      // req.data 是 next or prev 根据这个参数来决定是否切换到下一个tab还是上一个tab
      let nextTabIndex =
        req.data === "next" ? currentTabIndex + 1 : currentTabIndex - 1;
      if (nextTabIndex < 0) {
        nextTabIndex = tabs.length - 1;
      } else if (nextTabIndex > tabs.length - 1) {
        nextTabIndex = 0;
      }

      // 当前的tab设为不激活
      tabs.at(nextTabIndex)?.id &&
        chrome.tabs.update(tabs.at(nextTabIndex).id, {
          active: true,
          highlighted: true,
        });
      tabs.at(currentTabIndex)?.id &&
        chrome.tabs.update(tabs.at(currentTabIndex).id, { active: false });

      sendResponse({
        status: "success",
        data: { tabs, nextTabIndex, currentTabIndex },
      });
    })();
    return true;
  }
});

async function getAllTabs() {
  let tabs = await chrome.tabs.query({});
  return tabs;
}

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

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
        });
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
        currentTabIndex +
        (req.data === "next"
          ? currentTabIndex + 1 === tabs.length
            ? 2
            : 1
          : currentTabIndex === 0
          ? -1
          : currentTabIndex - 1);

      // 当前的tab设为不激活
      chrome.tabs.update(tabs.at(nextTabIndex).id, { active: true });
      chrome.tabs.update(tabs[currentTabIndex].id, { active: false });

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

function handleGetLocalStorage(req, sender, sendResponse) {
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
      });
      sendResponse({ status: "success", message: "调整速度成功" });
    }
  );
  return true;
}

function handleSwitchTab(req, sender, sendResponse) {
  (async () => {
    const tabs = await getAllTabs();
    const currentTabIndex = tabs.findIndex((tab) => tab.active);
    // req.data 是 next or prev 根据这个参数来决定是否切换到下一个tab还是上一个tab
    let nextTabIndex = currentTabIndex + (req.data === "next" ? 1 : -1);
    if (nextTabIndex < 0) {
      nextTabIndex = tabs.length - 1;
    } else if (nextTabIndex >= tabs.length) {
      nextTabIndex = 0;
    }
    chrome.tabs.update(tabs[nextTabIndex].id, { active: true });

    sendResponse({ status: "success", data: true });
  })();
  return true;
}

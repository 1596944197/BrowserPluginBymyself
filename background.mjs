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
        sendResponse({ status: "success", message: "调整音量成功" });
      }
    );
    return true;
  }
});

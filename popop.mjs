document.getElementById("saveColors").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "getCurrentColors" },
      (response) => {
        if (response) {
          const url = getDomainFromUrl(tabs[0].url);
          if (url === null) {
            chrome.notifications.create(undefined, {
              type: "basic",
              iconUrl: "icon.png",
              title: "Invalid URL",
              message: "Please enter a valid URL",
            });
            return;
          }
          const { thumbColor, hoverColor } = response;
          chrome.storage.sync.set({ [url]: { thumbColor, hoverColor } }, () => {
            chrome.notifications.create(undefined, {
              type: "basic",
              iconUrl: "icon.png",
              title: "Colors saved!",
              message: "Your colors have been saved!",
              priority: 2,
            });
          });
        }
      }
    );
  });
});

document.getElementById("removeColors").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = getDomainFromUrl(tabs[0].url);
    chrome.storage.sync.remove([url], () => {
      chrome.notifications.create(undefined, {
        type: "basic",
        iconUrl: "icon.png",
        title: "Colors removed!",
        message: "Your colors have been removed!",
      });
    });
  });
});

function getDomainFromUrl(url = "") {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.origin;
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}

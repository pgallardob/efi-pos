const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("receiptAPI", {
  print: () => ipcRenderer.invoke("receipt:print"),
  close: () => window.close()
});

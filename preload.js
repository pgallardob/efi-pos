const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("efiAPI", {
  saveSale: (sale) =>
    ipcRenderer.invoke("sale:save", sale),

  listSales: () =>
    ipcRenderer.invoke("sales:list"),

  updateSale: (index, changes) =>
    ipcRenderer.invoke("sales:update", index, changes),

  deleteSale: (index) =>
    ipcRenderer.invoke("sales:delete", index),

  listStock: () =>
    ipcRenderer.invoke("stock:list"),

  loadStock: (item) =>
    ipcRenderer.invoke("stock:load", item),

  updateStock: (item) =>
    ipcRenderer.invoke("stock:update", item),

  deleteStock: (product) =>
    ipcRenderer.invoke("stock:delete", product),

  previewReceipt: (sale) =>
    ipcRenderer.invoke("receipt:preview", sale),

  onOpenStock: (callback) => {
    ipcRenderer.on("menu:stock", () => {
      callback();
    });
  },

  onOpenStockStatus: (callback) => {
    ipcRenderer.on("menu:stockStatus", () => {
      callback();
    });
  },

  onOpenHistory: (callback) => {
    ipcRenderer.on("menu:history", () => {
      callback();
    });
  }
});
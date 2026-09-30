const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");

const { appendSale, readSales, updateSaleItem, deleteSaleItem } =
  require("./sales");

const {
  readStock,
  loadStockItem,
  deductStock,
  restoreStock,
  updateStockItem,
  deleteStockItem
} = require("./stock");

let mainWindow = null;

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
}

function buildMenu() {
  const isMac = process.platform === "darwin";

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about", label: "Acerca de Efi" },
              { type: "separator" },
              { role: "hide", label: "Ocultar" },
              { role: "hideOthers", label: "Ocultar otros" },
              { role: "unhide", label: "Mostrar todo" },
              { type: "separator" },
              { role: "quit", label: "Salir" }
            ]
          }
        ]
      : []),
    {
      label: "Archivo",
      submenu: [
        {
          label: "Historial de ventas",
          accelerator: "CmdOrCtrl+H",
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("menu:history");
            }
          }
        },
        { type: "separator" },
        isMac
          ? { role: "close", label: "Cerrar ventana" }
          : { role: "quit", label: "Salir" }
      ]
    },
    {
      label: "Stock",
      submenu: [
        {
          label: "Cargar Stock",
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("menu:stock");
            }
          }
        },
        {
          label: "Estado de Stock",
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("menu:stockStatus");
            }
          }
        }
      ]
    },
    {
      label: "Edición",
      submenu: [
        { role: "undo", label: "Deshacer" },
        { role: "redo", label: "Rehacer" },
        { type: "separator" },
        { role: "cut", label: "Cortar" },
        { role: "copy", label: "Copiar" },
        { role: "paste", label: "Pegar" },
        ...(isMac
          ? [
              {
                role: "pasteAndMatchStyle",
                label: "Pegar con el mismo estilo"
              },
              { role: "delete", label: "Eliminar" },
              { role: "selectAll", label: "Seleccionar todo" }
            ]
          : [
              { role: "delete", label: "Eliminar" },
              { type: "separator" },
              { role: "selectAll", label: "Seleccionar todo" }
            ])
      ]
    },
    {
      label: "Ver",
      submenu: [
        { role: "reload", label: "Recargar" },
        { role: "forceReload", label: "Forzar recarga" },
        {
          role: "toggleDevTools",
          label: "Herramientas de desarrollo"
        },
        { type: "separator" },
        { role: "resetZoom", label: "Tamaño real" },
        { role: "zoomIn", label: "Acercar" },
        { role: "zoomOut", label: "Alejar" },
        { type: "separator" },
        {
          role: "togglefullscreen",
          label: "Pantalla completa"
        }
      ]
    },
    {
      label: "Ventana",
      submenu: [
        { role: "minimize", label: "Minimizar" },
        { role: "zoom", label: "Zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front", label: "Traer todo al frente" }
            ]
          : [{ role: "close", label: "Cerrar" }])
      ]
    },
    {
      label: "Ayuda",
      role: "help",
      submenu: [
        {
          label: "Acerca de Efi",
          click: async () => {
            const { dialog } = require("electron");
            await dialog.showMessageBox({
              type: "info",
              title: "Acerca de",
              message: "Efi",
              detail: `Versión ${app.getVersion()}\nEfi`
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 760,
    minWidth: 850,
    minHeight: 650,
    backgroundColor: "#f4f6f8",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  if (!gotSingleInstanceLock) {
    return;
  }

  buildMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("sale:save", async (_, sale) => {
  try {
    let deduction = null;

    if (sale?.product) {
      deduction = deductStock(
        sale.product,
        sale.quantity
      );

      if (deduction?.ok === false) {
        return deduction;
      }
    }

    try {
      const file = appendSale(sale);
      return { ok: true, file };
    } catch (saveError) {
      if (sale?.product && deduction?.ok) {
        try {
          restoreStock(sale.product, sale.quantity);
        } catch (restoreError) {
          console.error(restoreError);
        }
      }

      throw saveError;
    }
  } catch (error) {
    return {
      ok: false,
      error: error?.message || "No se pudo registrar la venta."
    };
  }
});

ipcMain.handle("sales:list", async () => {
  try {
    return { ok: true, ...readSales() };
  } catch (error) {
    return {
      ok: false,
      rows: [],
      count: 0,
      totalSum: 0,
      error: error?.message || "No se pudo leer el historial."
    };
  }
});

ipcMain.handle("sales:update", async (_, index, changes) => {
  try {
    return updateSaleItem(index, changes);
  } catch (error) {
    return {
      ok: false,
      error: error?.message || "No se pudo actualizar la venta."
    };
  }
});

ipcMain.handle("sales:delete", async (_, index) => {
  try {
    return deleteSaleItem(index);
  } catch (error) {
    return {
      ok: false,
      error: error?.message || "No se pudo eliminar la venta."
    };
  }
});

ipcMain.handle("stock:list", async () => {
  try {
    return { ok: true, ...readStock() };
  } catch (error) {
    return {
      ok: false,
      rows: [],
      count: 0,
      error: error?.message || "No se pudo leer el stock."
    };
  }
});

ipcMain.handle("stock:load", async (_, item) => {
  try {
    return loadStockItem(item);
  } catch (error) {
    return {
      ok: false,
      error: error?.message || "No se pudo cargar el stock."
    };
  }
});

ipcMain.handle("stock:update", async (_, item) => {
  try {
    return updateStockItem(item);
  } catch (error) {
    return {
      ok: false,
      error: error?.message || "No se pudo actualizar el producto."
    };
  }
});

ipcMain.handle("stock:delete", async (_, product) => {
  try {
    return deleteStockItem(product);
  } catch (error) {
    return {
      ok: false,
      error: error?.message || "No se pudo eliminar el producto."
    };
  }
});
let receiptWindow = null;

function escapeHtml(text) {
  return String(text ?? "").replace(
    /[&<>"']/g,
    (char) => "&#" + char.charCodeAt(0) + ";"
  );
}

function receiptMoney(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(Math.round(Number(value) || 0));
}

function buildReceiptHtml(sale) {
  const safe = sale || {};
  const date = safe.date
    ? new Date(safe.date)
    : new Date();

  const isCash = safe.paymentMethod === "efectivo";
  const received = Number(safe.cashReceived) || 0;
  const total = Number(safe.total) || 0;

  const methodLabels = {
    efectivo: "Efectivo",
    debito: "Débito",
    credito: "Crédito"
  };

  const product = safe.product
    ? [
        safe.product.producto,
        safe.product.marca,
        safe.product.variedad
      ]
        .filter(Boolean)
        .join(" · ")
    : "Sin producto";

  const rows = [
    {
      label: "Producto",
      value: escapeHtml(product)
    },
    {
      label: "Cantidad",
      value: `${Math.round(
        Number(safe.quantity) || 0
      )} un`
    },
    {
      label: "Precio unitario",
      value: receiptMoney(safe.pricePerUnit)
    },
    {
      label: "Total",
      value: receiptMoney(total),
      strong: true
    },
    {
      label: "Medio de pago",
      value:
        methodLabels[safe.paymentMethod] ||
        escapeHtml(safe.paymentMethod || "-")
    },
    {
      label: "Recibido",
      value: isCash ? receiptMoney(received) : "-"
    },
    {
      label: "Vuelto",
      value: isCash
        ? receiptMoney(Math.max(0, received - total))
        : "-"
    }
  ];

  const rowsHtml = rows
    .map(
      ({ label, value, strong }) =>
        `<tr${
          strong ? ' class="receipt-total"' : ""
        }><th>${label}</th><td>${value}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Comprobante</title>
<style>
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: #d1d5db;
    font-family: "Courier New", monospace;
    text-align: center;
  }

  .toolbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 10px;
    background: #111827;
    z-index: 10;
  }

  .toolbar button {
    border: 0;
    border-radius: 8px;
    padding: 9px 18px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .toolbar .print {
    background: #059669;
    color: white;
  }

  .toolbar .close {
    background: #374151;
    color: white;
  }

  .receipt {
    width: 48mm;
    margin: 70px auto 30px;
    background: white;
    padding: 3mm 1.5mm;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    font-size: 3mm;
    line-height: 1.4;
    text-align: center;
  }

  .receipt h2 {
    margin: 0 0 1.5mm;
    font-size: 4mm;
    letter-spacing: 0.3mm;
    text-align: center;
  }

  .receipt-datetime {
    margin: 0 0 2.5mm;
    font-size: 2.7mm;
    color: #333;
    text-align: center;
  }

  .receipt-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 auto;
  }

  .receipt-table th,
  .receipt-table td {
    padding: 0.8mm 0.5mm;
    border-bottom: 0.3mm solid #ddd;
    font-size: 3mm;
    font-weight: 400;
    text-align: center;
    vertical-align: top;
  }

  .receipt-total th,
  .receipt-total td {
    border-bottom: 0;
    font-size: 3.5mm;
    font-weight: 700;
  }

  .receipt-thanks {
    margin: 3mm 0 1mm;
    font-size: 3mm;
    text-align: center;
  }

  @media print {
    @page {
      size: 48mm auto;
      margin: 0;
    }

    body {
      background: white;
      margin: 0;
    }

    .toolbar {
      display: none;
    }

    .receipt {
      width: 48mm;
      margin: 0 auto;
      padding: 1.5mm 1mm;
      box-shadow: none;
    }
  }
</style>
</head>
<body>

<div class="toolbar">
  <button class="print" onclick="window.receiptAPI.print()">
    Imprimir
  </button>
  <button class="close" onclick="window.receiptAPI.close()">
    Cerrar
  </button>
</div>

<div class="receipt">
  <h2>Comprobante de Venta</h2>

  <p class="receipt-datetime">${date.toLocaleDateString(
    "es-CL"
  )} ${date.toLocaleTimeString("es-CL")}</p>

  <table class="receipt-table">
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <p class="receipt-thanks">¡Gracias por su compra!</p>
</div>

</body>
</html>`;
}

ipcMain.handle("receipt:preview", async (_, sale) => {
  try {
    if (receiptWindow && !receiptWindow.isDestroyed()) {
      receiptWindow.close();
    }

    receiptWindow = new BrowserWindow({
      width: 360,
      height: 700,
      title: "Vista previa — Comprobante",
      autoHideMenuBar: true,
      backgroundColor: "#d1d5db",
      webPreferences: {
        preload: path.join(__dirname, "receipt-preload.js"),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    await receiptWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(buildReceiptHtml(sale))
    );

    receiptWindow.on("closed", () => {
      receiptWindow = null;
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error?.message ||
        "No se pudo abrir la vista previa."
    };
  }
});

ipcMain.handle("receipt:print", async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(
      event.sender
    );

    win?.webContents.print({
      printBackground: true,
      margins: { marginType: "none" },
      silent: true
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error?.message || "No se pudo imprimir."
    };
  }
});

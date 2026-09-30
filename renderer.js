"use strict";

const $ = (id) => document.getElementById(id);

const elements = {
  quantityInput: $("quantityInput"),
  quantityGhost: $("quantityGhost"),
  pricePerUnit: $("pricePerUnit"),
  totalDisplay: $("totalDisplay"),
  paymentButtons: document.querySelectorAll("[data-payment]"),
  cashPanel: $("cashPanel"),
  cashReceived: $("cashReceived"),
  cashTotal: $("cashTotal"),
  changeDisplay: $("changeDisplay"),
  message: $("message"),
  newSaleButton: $("newSaleButton"),
  payButton: $("payButton"),
  historyButton: $("historyButton"),
  historyModal: $("historyModal"),
  closeHistory: $("closeHistory"),
  closeHistoryBottom: $("closeHistoryBottom"),
  historyBody: $("historyBody"),
  historySummary: $("historySummary"),
  historyEmpty: $("historyEmpty"),
  historyDate: $("historyDate"),
  historyClearFilter: $("historyClearFilter"),
  printHistory: $("printHistory"),
  saleProduct: $("saleProduct"),
  stockModal: $("stockModal"),
  closeStock: $("closeStock"),
  cancelStock: $("cancelStock"),
  saveStockButton: $("saveStockButton"),
  stockExistente: $("stockExistente"),
  stockProducto: $("stockProducto"),
  stockMarca: $("stockMarca"),
  stockVariedad: $("stockVariedad"),
  stockCantidad: $("stockCantidad"),
  stockValor: $("stockValor"),
  stockMax: $("stockMax"),
  stockError: $("stockError"),
  stockTableBody: $("stockTableBody"),
  stockEmpty: $("stockEmpty"),
  stockStatusModal: $("stockStatusModal"),
  closeStockStatus: $("closeStockStatus"),
  closeStockStatusBottom: $("closeStockStatusBottom"),
  stockStatusBody: $("stockStatusBody"),
  stockStatusEmpty: $("stockStatusEmpty"),
  stockStatusSummary: $("stockStatusSummary"),
  stockEditModal: $("stockEditModal"),
  closeStockEdit: $("closeStockEdit"),
  cancelStockEdit: $("cancelStockEdit"),
  saveStockEditButton: $("saveStockEditButton"),
  editProducto: $("editProducto"),
  editMarca: $("editMarca"),
  editVariedad: $("editVariedad"),
  editCantidad: $("editCantidad"),
  editValor: $("editValor"),
  editMax: $("editMax"),
  stockEditError: $("stockEditError"),
  stockDeleteModal: $("stockDeleteModal"),
  closeStockDelete: $("closeStockDelete"),
  cancelStockDelete: $("cancelStockDelete"),
  confirmStockDeleteButton: $("confirmStockDeleteButton"),
  stockDeleteText: $("stockDeleteText"),
  historyEditModal: $("historyEditModal"),
  closeHistoryEdit: $("closeHistoryEdit"),
  cancelHistoryEdit: $("cancelHistoryEdit"),
  saveHistoryEditButton: $("saveHistoryEditButton"),
  historyEditFecha: $("historyEditFecha"),
  historyEditCantidad: $("historyEditCantidad"),
  historyEditPrecio: $("historyEditPrecio"),
  historyEditMetodo: $("historyEditMetodo"),
  historyEditRecibido: $("historyEditRecibido"),
  historyEditProducto: $("historyEditProducto"),
  historyEditError: $("historyEditError"),
  historyEditTotal: $("historyEditTotal"),
  historyDeleteModal: $("historyDeleteModal"),
  closeHistoryDelete: $("closeHistoryDelete"),
  cancelHistoryDelete: $("cancelHistoryDelete"),
  confirmHistoryDeleteButton: $("confirmHistoryDeleteButton"),
  historyDeleteText: $("historyDeleteText"),
  payAlertModal: $("payAlertModal"),
  closePayAlert: $("closePayAlert"),
  payAlertTitle: $("payAlertTitle"),
  payAlertIcon: $("payAlertIcon"),
  payAlertMessage: $("payAlertMessage"),
  payAlertPrint: $("payAlertPrint"),
  payAlertExit: $("payAlertExit"),
  historyPagination: $("historyPagination"),
  stockStatusPagination: $("stockStatusPagination"),
  stockPagination: $("stockPagination")
};

const state = {
  quantity: 0,
  total: 0,
  paymentMethod: null,
  stockRows: [],
  editingStock: null,
  deletingStock: null,
  editingHistory: null,
  deletingHistory: null,
  lastSale: null,
  historyPage: 1,
  stockStatusPage: 1,
  stockPage: 1
};

const EDIT_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';

const DELETE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';

const RECEIPT_PAYMENT_LABELS = {
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  transferencia: "Transferencia"
};

let messageTimer = null;
let historyData = { rows: [], count: 0, totalSum: 0 };

function money(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(Math.round(Number(value) || 0));
}

function syncQuantityGhost() {
  if (
    !elements.quantityGhost ||
    !elements.quantityInput
  ) {
    return;
  }

  const value = String(
    elements.quantityInput.value || "0"
  ).replace(/,/g, ".");

  elements.quantityGhost.textContent = value.replace(
    /[0-9]/g,
    "8"
  );
}

function setTotalDisplay(value) {
  if (!elements.totalDisplay) return;

  const amount = money(value).replace(/\$|\s/g, "");

  elements.totalDisplay.textContent = amount;
  elements.totalDisplay.dataset.ghost = amount.replace(
    /[0-9]/g,
    "8"
  );
}

function roundTo10(value) {
  return Math.round((Number(value) || 0) / 10) * 10;
}

function formatUnits(value) {
  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function parseStockUnits(value) {
  const number = Number(
    String(value ?? "").replace(",", ".")
  );

  return Number.isFinite(number) ? number : 0;
}

function unitsInputString(value) {
  const units = Math.round(parseStockUnits(value));

  if (!Number.isFinite(units) || units <= 0) {
    return "";
  }

  return String(units);
}

function showMessage(text, type = "") {
  if (!elements.message) return;

  elements.message.textContent = text;
  elements.message.className = `message ${type}`.trim();

  clearTimeout(messageTimer);

  messageTimer = setTimeout(() => {
    elements.message.classList.add("hidden");
  }, 5000);
}

function showStockError(text) {
  if (!elements.stockError) return;

  if (!text) {
    elements.stockError.classList.add("hidden");
    elements.stockError.textContent = "";
    return;
  }

  elements.stockError.textContent = text;
  elements.stockError.classList.remove("hidden");
}

function calculateTotal() {
  const price = Number(elements.pricePerUnit?.value) || 0;

  state.total = roundTo10(price * state.quantity);

  setTotalDisplay(state.total);

  updateCash();
}

function onQuantityInput() {
  const rawValue = String(
    elements.quantityInput?.value ?? ""
  );

  if (
    rawValue.length > 1 &&
    /^0+\d+$/.test(rawValue)
  ) {
    elements.quantityInput.value = String(
      Number(rawValue)
    );
  }

  const value = Number(elements.quantityInput?.value) || 0;

  state.quantity = Math.max(0, Math.round(value));

  syncQuantityGhost();

  calculateTotal();
}

function selectPayment(method) {
  state.paymentMethod = method;

  elements.paymentButtons.forEach((button) => {
    button.classList.toggle(
      "selected",
      button.dataset.payment === method
    );
  });

  if (elements.cashPanel) {
    elements.cashPanel.classList.toggle(
      "hidden",
      method !== "efectivo"
    );
  }

  if (method !== "efectivo" && elements.cashReceived) {
    elements.cashReceived.value = "";
  }

  updateCash();

  if (method === "efectivo") {
    elements.cashReceived?.focus();
  }
}

function updateCash() {
  if (elements.cashTotal) {
    elements.cashTotal.textContent = money(state.total);
  }

  if (state.paymentMethod !== "efectivo") {
    if (elements.changeDisplay) {
      elements.changeDisplay.textContent = money(0);
    }
    return;
  }

  const received =
    Number(elements.cashReceived?.value) || 0;
  const change = received - state.total;

  if (elements.changeDisplay) {
    elements.changeDisplay.textContent = money(
      change > 0 ? change : 0
    );
  }
}

function productLabel(row) {
  return [row?.producto, row?.marca, row?.variedad]
    .filter(Boolean)
    .join(" ");
}

function sortedStockRows() {
  const compare = (x, y) =>
    String(x || "").localeCompare(
      String(y || ""),
      "es",
      { sensitivity: "base" }
    );

  return [...state.stockRows].sort(
    (a, b) =>
      compare(a.producto, b.producto) ||
      compare(a.marca, b.marca) ||
      compare(a.variedad, b.variedad)
  );
}

async function loadStockOptions() {
  try {
    const data = await window.efiAPI?.listStock();

    if (data?.ok === false) {
      throw new Error(
        data.error || "No se pudo leer el stock."
      );
    }

    state.stockRows = Array.isArray(data?.rows)
      ? data.rows
      : [];
  } catch (error) {
    state.stockRows = [];
    showMessage(
      error?.message || "No se pudo leer el stock.",
      "error"
    );
  }

  renderStockSelector();
  renderSaleProductSelector();
}

function renderSaleProductSelector() {
  if (!elements.saleProduct) return;

  const previous = elements.saleProduct.value;

  elements.saleProduct.innerHTML = "";

  const none = document.createElement("option");
  none.value = "";
  none.textContent = "Seleccionar";
  elements.saleProduct.appendChild(none);

  for (const row of sortedStockRows()) {
    const option = document.createElement("option");
    option.value = productLabel(row);
    option.textContent = productLabel(row);
    elements.saleProduct.appendChild(option);
  }

  const stillThere = [...elements.saleProduct.options].some(
    (option) => option.value === previous
  );

  elements.saleProduct.value =
    previous && stillThere ? previous : "";
}

function getSelectedSaleProduct() {
  const label = elements.saleProduct?.value;

  return label
    ? state.stockRows.find(
        (row) => productLabel(row) === label
      ) || null
    : null;
}

function onSaleProductChange() {
  const row = getSelectedSaleProduct();

  if (row && elements.pricePerUnit) {
    elements.pricePerUnit.value = Math.round(
      parseStockUnits(row.valor_unitario)
    );
  }

  calculateTotal();
}

function renderStockSelector() {
  if (!elements.stockExistente) return;

  const previous = elements.stockExistente.value;

  elements.stockExistente.innerHTML = "";

  const nuevo = document.createElement("option");
  nuevo.value = "";
  nuevo.textContent = "— Nuevo producto —";
  elements.stockExistente.appendChild(nuevo);

  for (const row of sortedStockRows()) {
    const option = document.createElement("option");
    option.value = productLabel(row);
    option.textContent = `${productLabel(
      row
    )} · disp. ${formatUnits(row.cantidad)} un`;
    elements.stockExistente.appendChild(option);
  }

  const stillThere = [...elements.stockExistente.options].some(
    (option) => option.value === previous
  );

  elements.stockExistente.value =
    previous && stillThere ? previous : "";
}

function onStockExistenteChange() {
  const label = elements.stockExistente?.value;

  const row = label
    ? state.stockRows.find(
        (item) => productLabel(item) === label
      )
    : null;

  const isExisting = Boolean(row);

  if (elements.stockProducto) {
    elements.stockProducto.value = row?.producto || "";
    elements.stockProducto.readOnly = isExisting;
  }

  if (elements.stockMarca) {
    elements.stockMarca.value = row?.marca || "";
    elements.stockMarca.readOnly = isExisting;
  }

  if (elements.stockVariedad) {
    elements.stockVariedad.value = row?.variedad || "";
    elements.stockVariedad.readOnly = isExisting;
  }

  if (elements.stockValor) {
    elements.stockValor.value = row
      ? Math.round(parseStockUnits(row.valor_unitario))
      : "";
  }

  if (elements.stockMax) {
    elements.stockMax.value = row
      ? unitsInputString(row.stock_max)
      : "";
  }
}

function renderStockTable() {
  if (!elements.stockTableBody) return;

  elements.stockTableBody.innerHTML = "";

  const rows = sortedStockRows();

  const totalPages = Math.max(
    1,
    Math.ceil(rows.length / PAGE_SIZE)
  );

  state.stockPage = Math.min(
    Math.max(1, state.stockPage),
    totalPages
  );

  const pageRows = rows.slice(
    (state.stockPage - 1) * PAGE_SIZE,
    state.stockPage * PAGE_SIZE
  );

  elements.stockEmpty?.classList.toggle(
    "hidden",
    rows.length > 0
  );

  for (const row of pageRows) {
    const tr = document.createElement("tr");

    const values = [
      row.producto || "-",
      row.marca || "-",
      row.variedad || "-",
      formatUnits(row.cantidad),
      money(row.valor_unitario),
      formatUnits(row.stock_max)
    ];

    for (const value of values) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }

    elements.stockTableBody.appendChild(tr);
  }

  renderPagination(
    elements.stockPagination,
    state.stockPage,
    totalPages,
    (page) => {
      state.stockPage = page;
      renderStockTable();
    }
  );
}

async function openStockModal() {
  state.stockPage = 1;

  showStockError("");

  if (elements.stockExistente) {
    elements.stockExistente.value = "";
  }

  if (elements.stockProducto) {
    elements.stockProducto.value = "";
    elements.stockProducto.readOnly = false;
  }

  if (elements.stockMarca) {
    elements.stockMarca.value = "";
    elements.stockMarca.readOnly = false;
  }

  if (elements.stockVariedad) {
    elements.stockVariedad.value = "";
    elements.stockVariedad.readOnly = false;
  }

  if (elements.stockCantidad) {
    elements.stockCantidad.value = "";
  }

  if (elements.stockValor) {
    elements.stockValor.value = "";
  }

  if (elements.stockMax) {
    elements.stockMax.value = "";
  }

  elements.stockModal?.classList.remove("hidden");

  await loadStockOptions();
  renderStockTable();

  elements.stockProducto?.focus();
}

function closeStockModal() {
  elements.stockModal?.classList.add("hidden");
}

async function openStockStatusModal() {
  state.stockStatusPage = 1;

  elements.stockStatusModal?.classList.remove("hidden");

  await loadStockOptions();
  renderStockStatus();
}

function closeStockStatusModal() {
  elements.stockStatusModal?.classList.add("hidden");
}

function renderStockStatus() {
  if (!elements.stockStatusBody) return;

  elements.stockStatusBody.innerHTML = "";

  const rows = sortedStockRows();

  const totalPages = Math.max(
    1,
    Math.ceil(rows.length / PAGE_SIZE)
  );

  state.stockStatusPage = Math.min(
    Math.max(1, state.stockStatusPage),
    totalPages
  );

  const pageRows = rows.slice(
    (state.stockStatusPage - 1) * PAGE_SIZE,
    state.stockStatusPage * PAGE_SIZE
  );

  elements.stockStatusEmpty?.classList.toggle(
    "hidden",
    rows.length > 0
  );

  if (elements.stockStatusSummary) {
    elements.stockStatusSummary.innerHTML = "";

    const totalUnits = rows.reduce(
      (sum, row) =>
        sum + (parseStockUnits(row.cantidad) || 0),
      0
    );

    const totalValue = rows.reduce(
      (sum, row) =>
        sum +
        Math.round(
          parseStockUnits(row.valor_unitario) *
            (parseStockUnits(row.cantidad) || 0)
        ),
      0
    );

    const count = document.createElement("span");
    count.innerHTML = `<strong>${rows.length}</strong> producto${
      rows.length === 1 ? "" : "s"
    }`;

    const available = document.createElement("span");
    available.innerHTML = `Disponible: <strong>${formatUnits(
      totalUnits
    )} un</strong>`;

    const value = document.createElement("span");
    value.innerHTML = `Valor total: <strong>${money(
      totalValue
    )}</strong>`;

    elements.stockStatusSummary.appendChild(count);
    elements.stockStatusSummary.appendChild(available);
    elements.stockStatusSummary.appendChild(value);
  }

  for (const row of pageRows) {
    const tr = document.createElement("tr");

    const values = [
      row.producto || "-",
      row.marca || "-",
      row.variedad || "-",
      formatUnits(row.cantidad),
      money(row.valor_unitario),
      formatUnits(row.stock_max),
      row.fecha_carga || "-"
    ];

    for (const value of values) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }

    const actionsTd = document.createElement("td");
    actionsTd.className = "stock-actions";

    const editButton = document.createElement("button");
    editButton.className = "stock-action-button";
    editButton.title = "Editar";
    editButton.setAttribute("aria-label", "Editar");
    editButton.innerHTML = EDIT_ICON;
    editButton.addEventListener("click", () =>
      openEditStockModal(row)
    );

    const deleteButton = document.createElement("button");
    deleteButton.className = "stock-action-button danger";
    deleteButton.title = "Eliminar";
    deleteButton.setAttribute("aria-label", "Eliminar");
    deleteButton.innerHTML = DELETE_ICON;
    deleteButton.addEventListener("click", () =>
      openDeleteStockModal(row)
    );

    actionsTd.appendChild(editButton);
    actionsTd.appendChild(deleteButton);
    tr.appendChild(actionsTd);

    elements.stockStatusBody.appendChild(tr);
  }

  renderPagination(
    elements.stockStatusPagination,
    state.stockStatusPage,
    totalPages,
    (page) => {
      state.stockStatusPage = page;
      renderStockStatus();
    }
  );
}

function openEditStockModal(row) {
  state.editingStock = {
    producto: row.producto,
    marca: row.marca,
    variedad: row.variedad
  };

  showStockEditError("");

  if (elements.editProducto) {
    elements.editProducto.value = row.producto || "";
  }

  if (elements.editMarca) {
    elements.editMarca.value = row.marca || "";
  }

  if (elements.editVariedad) {
    elements.editVariedad.value = row.variedad || "";
  }

  if (elements.editCantidad) {
    elements.editCantidad.value = unitsInputString(
      row.cantidad
    );
  }

  if (elements.editValor) {
    elements.editValor.value = Math.round(
      parseStockUnits(row.valor_unitario)
    );
  }

  if (elements.editMax) {
    elements.editMax.value = unitsInputString(
      row.stock_max
    );
  }

  elements.stockEditModal?.classList.remove("hidden");
  elements.editProducto?.focus();
}

function closeStockEditModal() {
  elements.stockEditModal?.classList.add("hidden");
  state.editingStock = null;
}

function showStockEditError(text) {
  if (!elements.stockEditError) return;

  if (!text) {
    elements.stockEditError.classList.add("hidden");
    elements.stockEditError.textContent = "";
    return;
  }

  elements.stockEditError.textContent = text;
  elements.stockEditError.classList.remove("hidden");
}

async function saveStockEdit() {
  const item = {
    original: state.editingStock,
    producto: elements.editProducto?.value || "",
    marca: elements.editMarca?.value || "",
    variedad: elements.editVariedad?.value || "",
    cantidad: elements.editCantidad?.value || "",
    valor: elements.editValor?.value || "",
    stockMax: elements.editMax?.value || ""
  };

  try {
    const result = await window.efiAPI?.updateStock(
      item
    );

    if (result?.ok === false) {
      throw new Error(
        result.error || "No se pudo actualizar el producto."
      );
    }

    closeStockEditModal();
    await loadStockOptions();
    renderStockStatus();
    showMessage(
      "Producto actualizado correctamente.",
      "success"
    );
  } catch (error) {
    showStockEditError(
      error?.message || "No se pudo actualizar el producto."
    );
  }
}

function openDeleteStockModal(row) {
  state.deletingStock = {
    producto: row.producto,
    marca: row.marca,
    variedad: row.variedad
  };

  if (elements.stockDeleteText) {
    elements.stockDeleteText.textContent = `¿Eliminar "${productLabel(
      row
    )}" del stock? Esta acción no se puede deshacer.`;
  }

  elements.stockDeleteModal?.classList.remove("hidden");
}

function closeStockDeleteModal() {
  elements.stockDeleteModal?.classList.add("hidden");
  state.deletingStock = null;
}

async function confirmDeleteStock() {
  try {
    const result = await window.efiAPI?.deleteStock(
      state.deletingStock
    );

    if (result?.ok === false) {
      throw new Error(
        result.error || "No se pudo eliminar el producto."
      );
    }

    closeStockDeleteModal();
    await loadStockOptions();
    renderStockStatus();
    showMessage(
      "Producto eliminado del stock.",
      "success"
    );
  } catch (error) {
    closeStockDeleteModal();
    showMessage(
      error?.message || "No se pudo eliminar el producto.",
      "error"
    );
  }
}

async function saveStockItem() {
  const item = {
    producto: elements.stockProducto?.value || "",
    marca: elements.stockMarca?.value || "",
    variedad: elements.stockVariedad?.value || "",
    cantidad: elements.stockCantidad?.value || "",
    valor: elements.stockValor?.value || "",
    stockMax: elements.stockMax?.value || ""
  };

  try {
    const result = await window.efiAPI?.loadStock(item);

    if (result?.ok === false) {
      throw new Error(
        result.error || "No se pudo cargar el stock."
      );
    }

    closeStockModal();
    await loadStockOptions();
    showMessage("Stock cargado correctamente.", "success");
  } catch (error) {
    showStockError(
      error?.message || "No se pudo cargar el stock."
    );
  }
}

async function pay() {
  if (state.total <= 0) {
    showMessage(
      "No hay un monto para cobrar.",
      "error"
    );
    return;
  }

  if (!state.paymentMethod) {
    showMessage(
      "Seleccione un medio de pago.",
      "error"
    );
    return;
  }

  const cashReceived =
    Number(elements.cashReceived?.value) || 0;

  if (
    state.paymentMethod === "efectivo" &&
    cashReceived < state.total
  ) {
    showMessage(
      `Efectivo insuficiente. Faltan ${money(
        state.total - cashReceived
      )}.`,
      "error"
    );
    return;
  }

  const productRow = getSelectedSaleProduct();

  if (productRow) {
    const available = parseStockUnits(
      productRow.cantidad
    );

    if (state.quantity > available) {
      showPayAlert({
        success: false,
        message: `Efi, no se puede realizar esta operación porque el Stock para ${productLabel(
          productRow
        )} NO ES SUFICIENTE.`
      });
      return;
    }
  }

  const sale = {
    date: new Date().toISOString(),
    quantity: state.quantity,
    pricePerUnit:
      Number(elements.pricePerUnit?.value) || 0,
    total: state.total,
    paymentMethod: state.paymentMethod,
    cashReceived,
    product: productRow
      ? {
          producto: productRow.producto,
          marca: productRow.marca,
          variedad: productRow.variedad
        }
      : null
  };

  try {
    const result =
      await window.efiAPI?.saveSale(sale);

    if (result?.ok === false) {
      throw new Error(
        result.error || "No se pudo registrar la venta."
      );
    }

    resetSale();
    await loadStockOptions();
    showPayAlert({
      success: true,
      message: "Efi, el pago se registró con éxito.",
      sale
    });
  } catch (error) {
    showPayAlert({
      success: false,
      message:
        error?.message || "No se pudo registrar la venta."
    });
  }
}

function showPayAlert({ success, message, sale = null }) {
  state.lastSale = sale;

  if (elements.payAlertTitle) {
    elements.payAlertTitle.textContent = success
      ? "Pago registrado"
      : "Operación no realizada";
  }

  if (elements.payAlertIcon) {
    elements.payAlertIcon.textContent = success ? "✓" : "✕";
    elements.payAlertIcon.className = `pay-alert-icon ${
      success ? "success" : "error"
    }`;
  }

  if (elements.payAlertMessage) {
    elements.payAlertMessage.textContent = message;
  }

  elements.payAlertPrint?.classList.toggle(
    "hidden",
    !success
  );
  elements.payAlertExit?.classList.toggle(
    "hidden",
    !!success
  );

  elements.payAlertModal?.classList.remove("hidden");
}

function closePayAlert() {
  elements.payAlertModal?.classList.add("hidden");
  resetSale();
}

async function printReceipt() {
  const sale = state.lastSale;

  if (!sale) return;

  try {
    const result =
      await window.efiAPI?.previewReceipt(sale);

    if (result?.ok === false) {
      throw new Error(
        result.error ||
          "No se pudo abrir la vista previa."
      );
    }
  } catch (error) {
    showMessage(
      error?.message ||
        "No se pudo abrir la vista previa.",
      "error"
    );
  }
}

function resetSale() {
  state.total = 0;
  state.quantity = 0;
  state.paymentMethod = null;

  if (elements.quantityInput) {
    elements.quantityInput.value = 0;
  }

  syncQuantityGhost();

  if (elements.pricePerUnit) {
    elements.pricePerUnit.value = "";
  }

  if (elements.cashReceived) {
    elements.cashReceived.value = "";
  }

  setTotalDisplay(0);

  if (elements.changeDisplay) {
    elements.changeDisplay.textContent = money(0);
  }

  selectPayment(null);

  if (elements.saleProduct) {
    elements.saleProduct.value = "";
  }

  elements.quantityInput?.focus();
}

function getFilteredHistoryRows() {
  const rows = Array.isArray(historyData?.rows)
    ? historyData.rows
    : [];

  const selected = elements.historyDate?.value;

  if (!selected) {
    return rows;
  }

  const [year, month, day] = selected.split("-");

  return rows.filter((row) => {
    const match = String(row.fecha || "").match(
      /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/
    );

    if (!match) return false;

    return (
      Number(match[1]) === Number(day) &&
      Number(match[2]) === Number(month) &&
      Number(match[3]) === Number(year)
    );
  });
}

const PAGE_SIZE = 12;

function renderPagination(
  container,
  page,
  totalPages,
  onPageChange
) {
  if (!container) return;

  container.innerHTML = "";

  if (totalPages <= 1) {
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");

  const prevButton = document.createElement("button");
  prevButton.className = "pagination-button";
  prevButton.textContent = "Anterior";
  prevButton.disabled = page <= 1;
  prevButton.addEventListener("click", () =>
    onPageChange(page - 1)
  );

  const label = document.createElement("span");
  label.className = "pagination-label";
  label.textContent = `Página ${page} de ${totalPages}`;

  const nextButton = document.createElement("button");
  nextButton.className = "pagination-button";
  nextButton.textContent = "Siguiente";
  nextButton.disabled = page >= totalPages;
  nextButton.addEventListener("click", () =>
    onPageChange(page + 1)
  );

  container.appendChild(prevButton);
  container.appendChild(label);
  container.appendChild(nextButton);
}

function renderHistory() {
  if (!elements.historyBody) return;

  elements.historyBody.innerHTML = "";

  const rows = getFilteredHistoryRows();

  const totalPages = Math.max(
    1,
    Math.ceil(rows.length / PAGE_SIZE)
  );

  state.historyPage = Math.min(
    Math.max(1, state.historyPage),
    totalPages
  );

  const pageRows = rows.slice(
    (state.historyPage - 1) * PAGE_SIZE,
    state.historyPage * PAGE_SIZE
  );
  const filteredSum = rows.reduce(
    (sum, row) => sum + (parseInt(row.total, 10) || 0),
    0
  );

  if (elements.historyEmpty) {
    elements.historyEmpty.classList.toggle(
      "hidden",
      rows.length > 0
    );
  }

  if (elements.historySummary) {
    elements.historySummary.innerHTML = "";

    const count = document.createElement("span");
    count.innerHTML = `<strong>${
      rows.length
    }</strong> ventas${
      elements.historyDate?.value ? " en el día" : " registradas"
    }`;

    const sum = document.createElement("span");
    sum.innerHTML = `Total vendido: <strong>${money(
      filteredSum
    )}</strong>`;

    elements.historySummary.appendChild(count);
    elements.historySummary.appendChild(sum);
  }

  const columns = [
    "fecha",
    "cantidad",
    "valor_unitario",
    "total",
    "metodo_pago",
    "recibido",
    "vuelto",
    "producto"
  ];

  for (const row of pageRows) {
    const tr = document.createElement("tr");

    for (const key of columns) {
      const td = document.createElement("td");

      if (key === "cantidad") {
        const units = Number(
          String(row[key] || "").replace(",", ".")
        );
        td.textContent = Number.isFinite(units)
          ? String(Math.round(units))
          : row[key] || "-";
      } else if (key === "producto") {
        td.textContent = row[key] || "Sin producto";
      } else {
        td.textContent = row[key] || "-";
      }

      tr.appendChild(td);
    }

    const actionsTd = document.createElement("td");
    actionsTd.className = "stock-actions";

    const editButton = document.createElement("button");
    editButton.className = "stock-action-button";
    editButton.title = "Editar";
    editButton.setAttribute("aria-label", "Editar");
    editButton.innerHTML = EDIT_ICON;
    editButton.addEventListener("click", () =>
      openHistoryEditModal(row)
    );

    const deleteButton = document.createElement("button");
    deleteButton.className = "stock-action-button danger";
    deleteButton.title = "Eliminar";
    deleteButton.setAttribute("aria-label", "Eliminar");
    deleteButton.innerHTML = DELETE_ICON;
    deleteButton.addEventListener("click", () =>
      openHistoryDeleteModal(row)
    );

    actionsTd.appendChild(editButton);
    actionsTd.appendChild(deleteButton);
    tr.appendChild(actionsTd);

    elements.historyBody.appendChild(tr);
  }

  renderPagination(
    elements.historyPagination,
    state.historyPage,
    totalPages,
    (page) => {
      state.historyPage = page;
      renderHistory();
    }
  );
}

async function openHistoryModal() {
  state.historyPage = 1;

  if (elements.historyDate) {
    elements.historyDate.value = "";
  }

  elements.historyModal?.classList.remove("hidden");

  try {
    const data = await window.efiAPI?.listSales();

    if (data?.ok === false) {
      throw new Error(
        data.error || "No se pudo leer el historial."
      );
    }

    historyData = data;
    renderHistory();
  } catch (error) {
    historyData = { rows: [], count: 0, totalSum: 0 };
    renderHistory();
    showMessage(
      error?.message || "No se pudo leer el historial.",
      "error"
    );
  }
}

function printHistory() {
  window.print();
}

function closeHistoryModal() {
  elements.historyModal?.classList.add("hidden");
}

async function refreshHistoryData() {
  try {
    const data = await window.efiAPI?.listSales();

    if (data?.ok === false) {
      throw new Error(
        data.error || "No se pudo leer el historial."
      );
    }

    historyData = data;
  } catch (error) {
    historyData = { rows: [], count: 0, totalSum: 0 };
    showMessage(
      error?.message || "No se pudo leer el historial.",
      "error"
    );
  }

  renderHistory();
}

function parseHistoryNumber(value) {
  return Number(String(value ?? "").trim().replace(",", "."));
}

function updateHistoryEditTotal() {
  const cantidad = parseHistoryNumber(
    elements.historyEditCantidad?.value
  );
  const precio = parseHistoryNumber(
    elements.historyEditPrecio?.value
  );
  const total =
    Number.isFinite(cantidad) && Number.isFinite(precio)
      ? roundTo10(cantidad * precio)
      : 0;

  if (elements.historyEditTotal) {
    elements.historyEditTotal.value = money(total);
  }
}

function openHistoryEditModal(row) {
  state.editingHistory = historyData.rows.indexOf(row);

  if (state.editingHistory < 0) return;

  showHistoryEditError("");

  if (elements.historyEditFecha) {
    elements.historyEditFecha.value = row.fecha || "";
  }

  if (elements.historyEditCantidad) {
    const units = parseHistoryNumber(row.cantidad);
    elements.historyEditCantidad.value = Number.isFinite(
      units
    )
      ? String(Math.round(units))
      : "";
  }

  if (elements.historyEditPrecio) {
    elements.historyEditPrecio.value =
      row.valor_unitario || "";
  }

  if (elements.historyEditMetodo) {
    elements.historyEditMetodo.value = row.metodo_pago || "";
  }

  if (elements.historyEditRecibido) {
    elements.historyEditRecibido.value = row.recibido || "";
  }

  if (elements.historyEditProducto) {
    elements.historyEditProducto.value = row.producto || "";
  }

  updateHistoryEditTotal();
  elements.historyEditModal?.classList.remove("hidden");
  elements.historyEditFecha?.focus();
}

function closeHistoryEditModal() {
  elements.historyEditModal?.classList.add("hidden");
  state.editingHistory = null;
}

function showHistoryEditError(text) {
  if (!elements.historyEditError) return;

  if (!text) {
    elements.historyEditError.classList.add("hidden");
    elements.historyEditError.textContent = "";
    return;
  }

  elements.historyEditError.textContent = text;
  elements.historyEditError.classList.remove("hidden");
}

async function saveHistoryEdit() {
  const changes = {
    fecha: elements.historyEditFecha?.value || "",
    cantidad: elements.historyEditCantidad?.value || "",
    valor_unitario:
      elements.historyEditPrecio?.value || "",
    metodo_pago: elements.historyEditMetodo?.value || "",
    recibido: elements.historyEditRecibido?.value || "",
    producto: elements.historyEditProducto?.value || ""
  };

  try {
    const result = await window.efiAPI?.updateSale(
      state.editingHistory,
      changes
    );

    if (result?.ok === false) {
      throw new Error(
        result.error || "No se pudo actualizar la venta."
      );
    }

    closeHistoryEditModal();
    await refreshHistoryData();
    showMessage(
      "Venta actualizada correctamente.",
      "success"
    );
  } catch (error) {
    showHistoryEditError(
      error?.message || "No se pudo actualizar la venta."
    );
  }
}

function openHistoryDeleteModal(row) {
  state.deletingHistory = historyData.rows.indexOf(row);

  if (state.deletingHistory < 0) return;

  if (elements.historyDeleteText) {
    elements.historyDeleteText.textContent = `¿Eliminar la venta del ${
      row.fecha || ""
    } por ${money(row.total)}? Esta acción no se puede deshacer.`;
  }

  elements.historyDeleteModal?.classList.remove("hidden");
}

function closeHistoryDeleteModal() {
  elements.historyDeleteModal?.classList.add("hidden");
  state.deletingHistory = null;
}

async function confirmDeleteHistory() {
  try {
    const result = await window.efiAPI?.deleteSale(
      state.deletingHistory
    );

    if (result?.ok === false) {
      throw new Error(
        result.error || "No se pudo eliminar la venta."
      );
    }

    closeHistoryDeleteModal();
    await refreshHistoryData();
    showMessage(
      "Venta eliminada del historial.",
      "success"
    );
  } catch (error) {
    closeHistoryDeleteModal();
    showMessage(
      error?.message || "No se pudo eliminar la venta.",
      "error"
    );
  }
}

function setupEvents() {
  elements.quantityInput?.addEventListener(
    "input",
    onQuantityInput
  );

  elements.pricePerUnit?.addEventListener(
    "input",
    calculateTotal
  );

  elements.saleProduct?.addEventListener(
    "change",
    onSaleProductChange
  );

  elements.stockExistente?.addEventListener(
    "change",
    onStockExistenteChange
  );

  elements.closeStock?.addEventListener(
    "click",
    closeStockModal
  );

  elements.cancelStock?.addEventListener(
    "click",
    closeStockModal
  );

  elements.saveStockButton?.addEventListener(
    "click",
    saveStockItem
  );

  elements.stockModal?.addEventListener(
    "click",
    (event) => {
      if (event.target === elements.stockModal) {
        closeStockModal();
      }
    }
  );

  elements.closeStockStatus?.addEventListener(
    "click",
    closeStockStatusModal
  );

  elements.closeStockStatusBottom?.addEventListener(
    "click",
    closeStockStatusModal
  );

  elements.stockStatusModal?.addEventListener(
    "click",
    (event) => {
      if (event.target === elements.stockStatusModal) {
        closeStockStatusModal();
      }
    }
  );

  elements.closeStockEdit?.addEventListener(
    "click",
    closeStockEditModal
  );

  elements.cancelStockEdit?.addEventListener(
    "click",
    closeStockEditModal
  );

  elements.saveStockEditButton?.addEventListener(
    "click",
    saveStockEdit
  );

  elements.stockEditModal?.addEventListener(
    "click",
    (event) => {
      if (event.target === elements.stockEditModal) {
        closeStockEditModal();
      }
    }
  );

  elements.closeStockDelete?.addEventListener(
    "click",
    closeStockDeleteModal
  );

  elements.cancelStockDelete?.addEventListener(
    "click",
    closeStockDeleteModal
  );

  elements.confirmStockDeleteButton?.addEventListener(
    "click",
    confirmDeleteStock
  );

  elements.stockDeleteModal?.addEventListener(
    "click",
    (event) => {
      if (event.target === elements.stockDeleteModal) {
        closeStockDeleteModal();
      }
    }
  );

  elements.closeHistoryEdit?.addEventListener(
    "click",
    closeHistoryEditModal
  );

  elements.cancelHistoryEdit?.addEventListener(
    "click",
    closeHistoryEditModal
  );

  elements.saveHistoryEditButton?.addEventListener(
    "click",
    saveHistoryEdit
  );

  elements.historyEditModal?.addEventListener(
    "click",
    (event) => {
      if (event.target === elements.historyEditModal) {
        closeHistoryEditModal();
      }
    }
  );

  elements.historyEditCantidad?.addEventListener(
    "input",
    updateHistoryEditTotal
  );

  elements.historyEditPrecio?.addEventListener(
    "input",
    updateHistoryEditTotal
  );

  elements.closePayAlert?.addEventListener(
    "click",
    closePayAlert
  );

  elements.payAlertExit?.addEventListener(
    "click",
    closePayAlert
  );

  elements.payAlertPrint?.addEventListener(
    "click",
    printReceipt
  );

  elements.closeHistoryDelete?.addEventListener(
    "click",
    closeHistoryDeleteModal
  );

  elements.cancelHistoryDelete?.addEventListener(
    "click",
    closeHistoryDeleteModal
  );

  elements.confirmHistoryDeleteButton?.addEventListener(
    "click",
    confirmDeleteHistory
  );

  elements.historyDeleteModal?.addEventListener(
    "click",
    (event) => {
      if (event.target === elements.historyDeleteModal) {
        closeHistoryDeleteModal();
      }
    }
  );

  elements.cashReceived?.addEventListener(
    "input",
    updateCash
  );

  elements.paymentButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectPayment(
        state.paymentMethod === button.dataset.payment
          ? null
          : button.dataset.payment
      );
    });
  });

  elements.newSaleButton?.addEventListener(
    "click",
    resetSale
  );

  elements.payButton?.addEventListener(
    "click",
    pay
  );

  elements.historyButton?.addEventListener(
    "click",
    openHistoryModal
  );

  elements.closeHistory?.addEventListener(
    "click",
    closeHistoryModal
  );

  elements.closeHistoryBottom?.addEventListener(
    "click",
    closeHistoryModal
  );

  elements.historyModal?.addEventListener(
    "click",
    (event) => {
      if (event.target === elements.historyModal) {
        closeHistoryModal();
      }
    }
  );

  elements.historyDate?.addEventListener(
    "change",
    () => {
      state.historyPage = 1;
      renderHistory();
    }
  );

  elements.historyClearFilter?.addEventListener(
    "click",
    () => {
      if (elements.historyDate) {
        elements.historyDate.value = "";
      }

      state.historyPage = 1;
      renderHistory();
    }
  );

  elements.printHistory?.addEventListener(
    "click",
    printHistory
  );
}

function setupMenuEvents() {
  if (
    typeof window.efiAPI?.onOpenHistory === "function"
  ) {
    window.efiAPI.onOpenHistory(() => {
      openHistoryModal();
    });
  }

  if (
    typeof window.efiAPI?.onOpenStock === "function"
  ) {
    window.efiAPI.onOpenStock(() => {
      openStockModal();
    });
  }

  if (
    typeof window.efiAPI?.onOpenStockStatus === "function"
  ) {
    window.efiAPI.onOpenStockStatus(() => {
      openStockStatusModal();
    });
  }
}

async function initialize() {
  setupEvents();
  setupMenuEvents();

  await loadStockOptions();

  selectPayment(null);
  syncQuantityGhost();
  calculateTotal();
  elements.saleProduct?.focus();
}

document.addEventListener("DOMContentLoaded", initialize);

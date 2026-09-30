const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const directory = app.getPath("userData");
const filePath = path.join(directory, "ventas.csv");

const HEADER =
  "fecha;hora;cantidad;valor_unitario;total;metodo_pago;recibido;vuelto;producto\r\n";

const PAYMENT_LABELS = {
  debito: "Débito",
  credito: "Crédito",
  efectivo: "Efectivo",
  transferencia: "Transferencia"
};

function formatDecimal(value, decimals = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toFixed(decimals).replace(".", ",");
}

function appendSale(sale) {
  const now = sale?.date ? new Date(sale.date) : new Date();

  const fecha = now.toLocaleDateString("es-CL");
  const hora = now.toLocaleTimeString("es-CL");

  const total = roundTo10(sale?.total);
  const isCash = sale?.paymentMethod === "efectivo";
  const received = isCash
    ? Math.round(Number(sale?.cashReceived) || 0)
    : "";
  const change = isCash
    ? Math.max(0, (Number(received) || 0) - total)
    : "";

  const method =
    PAYMENT_LABELS[sale?.paymentMethod] ||
    sale?.paymentMethod ||
    "";

  const producto = [
    sale?.product?.producto,
    sale?.product?.marca,
    sale?.product?.variedad
  ]
    .filter(Boolean)
    .join(" ");

  const line =
    [
      fecha,
      hora,
      Math.round(Number(sale?.quantity) || 0),
      Math.round(Number(sale?.pricePerUnit) || 0),
      total,
      method,
      received,
      change,
      producto
    ].join(";") + "\r\n";

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, HEADER, "utf8");
  } else {
    const content = fs.readFileSync(filePath, "utf8");
    const firstLine = content.split(/\r?\n/, 1)[0];

    if (firstLine !== HEADER.trimEnd()) {
      const lines = content.split(/\r?\n/).filter(Boolean);
      lines[0] = HEADER.trimEnd();
      fs.writeFileSync(
        filePath,
        lines.join("\r\n") + "\r\n",
        "utf8"
      );
    }
  }

  fs.appendFileSync(filePath, line, "utf8");

  return filePath;
}

function readSales() {
  if (!fs.existsSync(filePath)) {
    return { rows: [], count: 0, totalSum: 0, file: filePath };
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter(Boolean);

  const rows = lines.slice(1).map((line) => {
    const [
      fecha,
      hora,
      cantidad,
      valor_unitario,
      total,
      metodo_pago,
      recibido,
      vuelto,
      producto
    ] = line.split(";");

    return {
      fecha,
      hora,
      cantidad,
      valor_unitario,
      total,
      metodo_pago,
      recibido,
      vuelto,
      producto: producto ?? ""
    };
  });

  const totalSum = rows.reduce(
    (sum, row) => sum + (parseInt(row.total, 10) || 0),
    0
  );

  return { rows, count: rows.length, totalSum, file: filePath };
}

function parseNumberField(value) {
  return Number(String(value ?? "").trim().replace(",", "."));
}

function readSaleLines() {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter(Boolean);

  if (lines.length <= 1) {
    return null;
  }

  return { header: lines[0], data: lines.slice(1) };
}

function roundTo10(value) {
  return Math.round((Number(value) || 0) / 10) * 10;
}

function updateSaleItem(index, changes) {
  const file = readSaleLines();

  if (!file) {
    return { ok: false, error: "No hay ventas registradas." };
  }

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= file.data.length
  ) {
    return { ok: false, error: "La venta no existe." };
  }

  const fecha = String(changes?.fecha ?? "").trim();

  if (!/^\d{2}-\d{2}-\d{4}$/.test(fecha)) {
    return {
      ok: false,
      error: "La fecha debe tener el formato dd-mm-aaaa."
    };
  }

  const cantidad = Math.round(
    parseNumberField(changes?.cantidad)
  );

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return {
      ok: false,
      error: "La cantidad debe ser mayor a 0."
    };
  }

  const valorUnitario = parseNumberField(
    changes?.valor_unitario
  );

  if (!Number.isFinite(valorUnitario) || valorUnitario <= 0) {
    return {
      ok: false,
      error: "El precio unitario debe ser mayor a 0."
    };
  }

  const metodoPago = String(changes?.metodo_pago ?? "").trim();

  if (!metodoPago) {
    return { ok: false, error: "Seleccione el medio de pago." };
  }

  const total = roundTo10(cantidad * valorUnitario);
  const isCash = metodoPago === "Efectivo";

  let recibido = "";
  let vuelto = "";

  if (isCash) {
    const received = Math.round(
      parseNumberField(changes?.recibido)
    );

    if (!Number.isFinite(received) || received < total) {
      return {
        ok: false,
        error: `Con Efectivo, el monto recibido debe ser mayor o igual al total (${total}).`
      };
    }

    recibido = String(received);
    vuelto = String(received - total);
  }

  const hora = file.data[index].split(";")[1] || "";
  const producto = String(changes?.producto ?? "").trim();

  if (/[;\r\n]/.test(producto)) {
    return {
      ok: false,
      error: "El producto no puede contener punto y coma (;)."
    };
  }

  file.data[index] = [
    fecha,
    hora,
    String(cantidad),
    String(Math.round(valorUnitario)),
    String(total),
    metodoPago,
    recibido,
    vuelto,
    producto
  ].join(";");

  fs.writeFileSync(
    filePath,
    [file.header, ...file.data].join("\r\n") + "\r\n",
    "utf8"
  );

  return { ok: true, ...readSales() };
}

function deleteSaleItem(index) {
  const file = readSaleLines();

  if (!file) {
    return { ok: false, error: "No hay ventas registradas." };
  }

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= file.data.length
  ) {
    return { ok: false, error: "La venta no existe." };
  }

  file.data.splice(index, 1);

  fs.writeFileSync(
    filePath,
    [file.header, ...file.data].join("\r\n") + "\r\n",
    "utf8"
  );

  return { ok: true, ...readSales() };
}

module.exports = {
  appendSale,
  readSales,
  updateSaleItem,
  deleteSaleItem
};

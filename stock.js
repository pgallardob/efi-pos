const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const directory = app.getPath("userData");
const filePath = path.join(directory, "stock.csv");

const HEADER =
  "producto;marca;variedad;cantidad;valor_unitario;stock_max;fecha_carga\r\n";

function parseUnits(value) {
  const number = Number(
    String(value ?? "").replace(",", ".")
  );

  if (!Number.isFinite(number)) {
    return NaN;
  }

  return Math.round(number);
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function sameProduct(row, product) {
  return (
    normalizeText(row.producto) ===
      normalizeText(product?.producto) &&
    normalizeText(row.marca) ===
      normalizeText(product?.marca) &&
    normalizeText(row.variedad) ===
      normalizeText(product?.variedad)
  );
}

function hasInvalidText(value) {
  return /[;\r\n]/.test(String(value ?? ""));
}

function readStock() {
  if (!fs.existsSync(filePath)) {
    return { rows: [], count: 0, file: filePath };
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter(Boolean);

  const rows = lines.slice(1).map((line) => {
    const [
      producto,
      marca,
      variedad,
      cantidad,
      valor_unitario,
      stock_max,
      fecha_carga
    ] = line.split(";");

    return {
      producto,
      marca,
      variedad,
      cantidad,
      valor_unitario,
      stock_max,
      fecha_carga
    };
  });

  return { rows, count: rows.length, file: filePath };
}

function writeStock(rows) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const content =
    HEADER +
    rows
      .map((row) =>
        [
          row.producto,
          row.marca,
          row.variedad,
          row.cantidad,
          row.valor_unitario,
          row.stock_max,
          row.fecha_carga
        ].join(";")
      )
      .join("\r\n") + "\r\n";

  fs.writeFileSync(filePath, content, "utf8");
}

function loadStockItem(item) {
  const producto = String(item?.producto ?? "").trim();
  const marca = String(item?.marca ?? "").trim();
  const variedad = String(item?.variedad ?? "").trim();

  if (!producto) {
    return {
      ok: false,
      error: "Ingrese el nombre del producto."
    };
  }

  if (
    hasInvalidText(producto) ||
    hasInvalidText(marca) ||
    hasInvalidText(variedad)
  ) {
    return {
      ok: false,
      error: "Los nombres no pueden contener punto y coma (;)."
    };
  }

  const cantidad = parseUnits(item?.cantidad);

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return {
      ok: false,
      error: "La cantidad debe ser mayor a 0."
    };
  }

  const stockMax = parseUnits(item?.stockMax);

  if (!Number.isFinite(stockMax) || stockMax <= 0) {
    return {
      ok: false,
      error: "El stock máximo debe ser mayor a 0."
    };
  }

  const valorUnitario = Math.round(Number(item?.valor) || 0);

  if (valorUnitario <= 0) {
    return {
      ok: false,
      error: "El valor unitario debe ser mayor a 0."
    };
  }

  const rows = readStock().rows;
  const existing = rows.find((row) =>
    sameProduct(row, { producto, marca, variedad })
  );

  const currentUnits = existing
    ? parseUnits(existing.cantidad) || 0
    : 0;
  const newTotalUnits = currentUnits + cantidad;

  if (newTotalUnits > stockMax) {
    return {
      ok: false,
      error: `Supera el stock máximo (${stockMax} un). Queda espacio para ${
        Math.max(0, stockMax - currentUnits)
      } un.`
    };
  }

  const now = new Date();
  const fecha_carga = `${now.toLocaleDateString(
    "es-CL"
  )} ${now.toLocaleTimeString("es-CL")}`;

  if (existing) {
    existing.cantidad = String(newTotalUnits);
    existing.valor_unitario = String(valorUnitario);
    existing.stock_max = String(stockMax);
    existing.fecha_carga = fecha_carga;
  } else {
    rows.push({
      producto,
      marca,
      variedad,
      cantidad: String(cantidad),
      valor_unitario: String(valorUnitario),
      stock_max: String(stockMax),
      fecha_carga
    });
  }

  writeStock(rows);

  return { ok: true, rows: readStock().rows };
}

function deductStock(product, quantity) {
  const amount = Math.round(Number(quantity) || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      error: "Cantidad inválida para descontar del stock."
    };
  }

  const rows = readStock().rows;
  const row = rows.find((item) => sameProduct(item, product));

  if (!row) {
    return {
      ok: false,
      error: "El producto no existe en el stock."
    };
  }

  const available = parseUnits(row.cantidad) || 0;

  if (amount > available) {
    return {
      ok: false,
      error: `Stock insuficiente de "${
        row.producto
      }": disponible ${available} un, solicitado ${amount} un.`
    };
  }

  row.cantidad = String(available - amount);

  writeStock(rows);

  return {
    ok: true,
    remainingUnits: available - amount
  };
}

function restoreStock(product, quantity) {
  const amount = Math.round(Number(quantity) || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      error: "Cantidad inválida para reponer el stock."
    };
  }

  const rows = readStock().rows;
  const row = rows.find((item) => sameProduct(item, product));

  if (!row) {
    return {
      ok: false,
      error: "El producto no existe en el stock."
    };
  }

  const available = parseUnits(row.cantidad) || 0;

  row.cantidad = String(available + amount);

  writeStock(rows);

  return { ok: true };
}

function updateStockItem(item) {
  const producto = String(item?.producto ?? "").trim();
  const marca = String(item?.marca ?? "").trim();
  const variedad = String(item?.variedad ?? "").trim();

  if (!producto) {
    return {
      ok: false,
      error: "Ingrese el nombre del producto."
    };
  }

  if (
    hasInvalidText(producto) ||
    hasInvalidText(marca) ||
    hasInvalidText(variedad)
  ) {
    return {
      ok: false,
      error: "Los nombres no pueden contener punto y coma (;)."
    };
  }

  const cantidad = parseUnits(item?.cantidad);

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return {
      ok: false,
      error: "La cantidad debe ser mayor a 0."
    };
  }

  const stockMax = parseUnits(item?.stockMax);

  if (!Number.isFinite(stockMax) || stockMax <= 0) {
    return {
      ok: false,
      error: "El stock máximo debe ser mayor a 0."
    };
  }

  const valorUnitario = Math.round(Number(item?.valor) || 0);

  if (valorUnitario <= 0) {
    return {
      ok: false,
      error: "El valor unitario debe ser mayor a 0."
    };
  }

  if (cantidad > stockMax) {
    return {
      ok: false,
      error: `La cantidad (${cantidad} un) supera el stock máximo (${stockMax} un).`
    };
  }

  const rows = readStock().rows;
  const index = rows.findIndex((row) =>
    sameProduct(row, item?.original)
  );

  if (index < 0) {
    return {
      ok: false,
      error: "El producto no existe en el stock."
    };
  }

  const duplicate = rows.findIndex(
    (row, i) =>
      i !== index &&
      sameProduct(row, { producto, marca, variedad })
  );

  if (duplicate >= 0) {
    return {
      ok: false,
      error: "Ya existe un producto con ese nombre, marca y variedad."
    };
  }

  rows[index] = {
    producto,
    marca,
    variedad,
    cantidad: String(cantidad),
    valor_unitario: String(valorUnitario),
    stock_max: String(stockMax),
    fecha_carga: rows[index].fecha_carga
  };

  writeStock(rows);

  return { ok: true, rows: readStock().rows };
}

function deleteStockItem(product) {
  const rows = readStock().rows;
  const index = rows.findIndex((row) =>
    sameProduct(row, product)
  );

  if (index < 0) {
    return {
      ok: false,
      error: "El producto no existe en el stock."
    };
  }

  const removed = rows.splice(index, 1)[0];
  writeStock(rows);

  return { ok: true, removed, rows: readStock().rows };
}

module.exports = {
  readStock,
  loadStockItem,
  deductStock,
  restoreStock,
  updateStockItem,
  deleteStockItem
};

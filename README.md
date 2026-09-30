# Efi — Bazar y Paquetería

Sistema POS para la venta de artículos de bazar y paquetería por unidades.

Cada producto se vende indicando la cantidad y el precio por unidad, con descuento automático del stock.

## Características

- Venta por unidades con cálculo automático del total y el vuelto
- Medios de pago: débito, crédito, efectivo y transferencia
- Control de stock con máximo por producto y alerta cuando no alcanza
- Carga de stock con detección de productos existentes
- Historial de ventas con filtro por fecha, edición y eliminación
- Vista previa e impresión del comprobante para impresora térmica de 48 mm
- Displays estilo Casio con tipografía DSEG
- Paginación en historial, estado de stock y carga de stock

## Requisitos

- Node.js 18 o superior

## Instalación

```
npm install
```

## Uso

```
npm start
```

## Compilar instalador

```
npm run dist:win
```

Genera el instalador y la versión portable en la carpeta `dist`.

## Datos

Las ventas y el stock se guardan fuera del proyecto:

- Windows: `%APPDATA%\efi\ventas.csv`
- Windows: `%APPDATA%\efi\stock.csv`

Cada computadora mantiene sus propios archivos de datos.

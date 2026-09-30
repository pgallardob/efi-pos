# Efi — Bazar y Paquetería

Sistema POS para la venta de artículos de bazar y paquetería por unidades.

Mantiene la estructura de Balanza POS (ventas, historial editable, stock con máximo, comprobante imprimible y displays estilo Casio) pero sin balanza: cada producto se vende indicando la cantidad y el precio por unidad, con descuento automático del stock.

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

## Datos

Las ventas y el stock se guardan fuera del proyecto:

- Windows: `%APPDATA%\efi\ventas.csv`
- Windows: `%APPDATA%\efi\stock.csv`

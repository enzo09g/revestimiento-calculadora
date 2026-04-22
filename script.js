const PRODUCT_FAMILIES = {
  revestimiento: {
    label: "Revestimiento",
    selectorTitle: "Elegi que revestimiento estas vendiendo",
    products: [
      {
        key: "revestimiento-10mm",
        name: "Revestimiento 10 mm",
        shortName: "Revestimiento 10 mm",
        widthMeters: 0.25,
        heightMeters: 2.7,
        thickness: "10 mm",
        areaDecimals: 3,
        pricePerSheet: 572,
      },
      {
        key: "revestimiento-7mm",
        name: "Revestimiento 7 mm",
        shortName: "Revestimiento 7 mm",
        widthMeters: 0.2,
        heightMeters: 6,
        thickness: "7 mm",
        areaDecimals: 2,
        pricePerSheet: 824,
      },
    ],
  },
  cieloRaso: {
    label: "Cielo raso",
    selectorTitle: "Elegi que cielo raso estas vendiendo",
    products: [
      {
        key: "cielo-raso-blanco-liviano-4m",
        name: "Cielo raso blanco liviano 4 m",
        shortName: "Blanco liviano 4 m",
        widthMeters: 0.2,
        heightMeters: 4,
        thickness: "7 mm",
        areaDecimals: 2,
        pricePerSheet: 130,
      },
      {
        key: "cielo-raso-blanco-liviano-6m",
        name: "Cielo raso blanco liviano 6 m",
        shortName: "Blanco liviano 6 m",
        widthMeters: 0.2,
        heightMeters: 6,
        thickness: "7 mm",
        areaDecimals: 2,
        pricePerSheet: 195,
      },
      {
        key: "cielo-raso-blanco-reforzado",
        name: "Cielo raso blanco reforzado",
        shortName: "Blanco reforzado",
        widthMeters: 0.2,
        heightMeters: 5.95,
        thickness: "10 mm",
        areaDecimals: 2,
        pricePerSheet: 380,
      },
      {
        key: "cielo-raso-natural",
        name: "Cielo raso natural 6 m",
        shortName: "Natural 6 m",
        widthMeters: 0.2,
        heightMeters: 6,
        thickness: "7 mm",
        areaDecimals: 2,
        pricePerSheet: 301,
      },
      {
        key: "cielo-raso-cerejeira",
        name: "Cielo raso cerejeira 6 m",
        shortName: "Cerejeira 6 m",
        widthMeters: 0.2,
        heightMeters: 6,
        thickness: "7 mm",
        areaDecimals: 2,
        pricePerSheet: 301,
      },
    ],
  },
};

const calculatorForm = document.querySelector("#calculator-form");
const familyInputs = document.querySelectorAll('input[name="productFamily"]');
const calculationTypeInputs = document.querySelectorAll('input[name="calculationType"]');
const productGrid = document.querySelector("#product-grid");
const productSelectorTitle = document.querySelector("#product-selector-title");
const squareMetersFields = document.querySelector("#square-meters-fields");
const wallFields = document.querySelector("#wall-fields");
const selectedName = document.querySelector("#selected-name");
const selectedSize = document.querySelector("#selected-size");
const selectedThickness = document.querySelector("#selected-thickness");
const selectedArea = document.querySelector("#selected-area");
const selectedPrice = document.querySelector("#selected-price");
const formulaDetail = document.querySelector("#formula-detail");
const calculatorResult = document.querySelector("#calculator-result");
const visualizationStage = document.querySelector("#visualization-stage");
const visualSurfaceLabel = document.querySelector("#visual-surface-label");
const visualCoverageLabel = document.querySelector("#visual-coverage-label");
const coverageSummary = document.querySelector("#coverage-summary");
const coverageUsed = document.querySelector("#coverage-used");
const coverageExtra = document.querySelector("#coverage-extra");
const cutSummary = document.querySelector("#cut-summary");
const placementOptions = document.querySelector("#placement-options");
const placementModeButtons = document.querySelectorAll("[data-placement-mode]");
const printVisualizationButton = document.querySelector("#print-visualization");
const printProductName = document.querySelector("#print-product-name");
const printSheetsCount = document.querySelector("#print-sheets-count");
const printTotalPrice = document.querySelector("#print-total-price");

let activeFamilyKey = "revestimiento";
let activeProductKey = "revestimiento-10mm";
let activeCalculationType = "squareMeters";
let activePlacementMode = "tidy";
let lastCalculation = null;

function getProductsForActiveFamily() {
  return PRODUCT_FAMILIES[activeFamilyKey].products;
}

function getActiveProduct() {
  return getProductsForActiveFamily().find((product) => product.key === activeProductKey);
}

function getProductArea(product) {
  return product.widthMeters * product.heightMeters;
}

function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("es-UY", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

function formatCurrency(value) {
  return `$ ${new Intl.NumberFormat("es-UY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculateSheetsByArea(area, product) {
  return PlacementEngine.calculateSheetsByArea(area, product);
}

function getVisualizationDimensions(area) {
  const side = Math.sqrt(area);

  return {
    widthMeters: side,
    heightMeters: side,
    label: `${formatNumber(side)} m x ${formatNumber(side)} m aprox.`,
  };
}

function computeWallPlacement(product, wallWidth, wallHeight) {
  return PlacementEngine.computeWallPlacement(product, wallWidth, wallHeight);
}

function computeEconomicalPlacement(product, wallWidth, wallHeight) {
  return PlacementEngine.computeEconomicalPlacement(product, wallWidth, wallHeight);
}

function getPrintableMeasureClass(measureKey, printedMeasureKeys) {
  if (printedMeasureKeys.has(measureKey)) {
    return "";
  }

  printedMeasureKeys.add(measureKey);
  return " is-print-key";
}

function renderVisualizationPlaceholder(message) {
  placementOptions.classList.add("is-hidden");
  visualizationStage.style.height = "";
  visualizationStage.innerHTML = `<div class="visualization-placeholder">${message}</div>`;
  visualSurfaceLabel.textContent = "Esperando calculo";
  visualCoverageLabel.textContent = "0 m²";
  cutSummary.textContent = "Calcula para ver como se colocan y cortan las hojas.";
  coverageSummary.textContent = "Calcula para ver la diferencia entre pedido y cobertura.";
  coverageUsed.style.width = "0%";
  coverageExtra.style.width = "0%";
}

function updatePlacementOptions() {
  const canCompare = Boolean(lastCalculation?.tidyPlacement && lastCalculation?.economicalPlacement);

  placementOptions.classList.toggle("is-hidden", !canCompare);

  placementModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.placementMode === activePlacementMode);
  });
}

function setVisualizationStageHeight(payload) {
  if (document.body.classList.contains("is-printing-visualization")) {
    visualizationStage.style.height = "423px";
    return;
  }

  const stageWidth = visualizationStage.clientWidth || 520;
  let nextHeight = 460;

  if (payload.placement) {
    const aspectRatio = payload.placement.wallWidth / payload.placement.wallHeight;
    const targetSurfaceWidth = Math.max(stageWidth - 88, 240);
    const targetSurfaceHeight = targetSurfaceWidth / Math.max(aspectRatio, 0.2);
    const reserveTop = 52;
    const reserveBottom = payload.placement.leftoverPieces > 0 ? 96 : 48;
    const preferredMaxHeight = aspectRatio <= 1.2 ? 560 : 660;
    nextHeight = clamp(targetSurfaceHeight + reserveTop + reserveBottom, 360, preferredMaxHeight);
  } else if (payload.area && payload.product) {
    const { widthMeters, heightMeters } = getVisualizationDimensions(payload.area);
    const aspectRatio = widthMeters / heightMeters;
    const targetSurfaceWidth = Math.max(stageWidth - 88, 240);
    const targetSurfaceHeight = targetSurfaceWidth / Math.max(aspectRatio, 0.5);
    nextHeight = clamp(targetSurfaceHeight + 96, 360, 560);
  }

  visualizationStage.style.height = `${Math.round(nextHeight)}px`;
}

function renderPlacementVisualization(placement, product, area, totalCoveredArea, overflowArea) {
  const stageWidth = visualizationStage.clientWidth || 520;
  const stageHeight = visualizationStage.clientHeight || 300;
  const paddingX = placement.columnWidths.length > 18 ? 28 : 44;
  const topReserve = 52;
  const bottomReserve = placement.leftoverPieces > 0 ? 96 : 48;
  const usableHeight = Math.max(stageHeight - topReserve - bottomReserve, 140);
  const scale = Math.min((stageWidth - (paddingX * 2)) / placement.wallWidth, usableHeight / placement.wallHeight);
  const surfaceWidth = Math.max(placement.wallWidth * scale, 48);
  const surfaceHeight = Math.max(placement.wallHeight * scale, 48);
  const surfaceLeft = (stageWidth - surfaceWidth) / 2;
  const surfaceTop = topReserve + ((usableHeight - surfaceHeight) / 2);
  const stageMarkup = [];

  stageMarkup.push(`
    <div
      class="visualization-surface"
      style="left:${surfaceLeft}px; top:${surfaceTop}px; width:${surfaceWidth}px; height:${surfaceHeight}px;"
      title="Superficie solicitada"
    ></div>
    <div
      class="dimension-line horizontal"
      style="left:${surfaceLeft}px; top:${surfaceTop - 18}px; width:${surfaceWidth}px;"
    ></div>
    <div
      class="dimension-label"
      style="left:${surfaceLeft + (surfaceWidth / 2) - 28}px; top:${surfaceTop - 34}px;"
    >${formatNumber(placement.wallWidth)} m</div>
    <div
      class="dimension-line vertical"
      style="left:${surfaceLeft - 18}px; top:${surfaceTop}px; height:${surfaceHeight}px;"
    ></div>
    <div
      class="dimension-label"
      style="left:${surfaceLeft - 42}px; top:${surfaceTop + (surfaceHeight / 2) - 10}px;"
    >${formatNumber(placement.wallHeight)} m</div>
  `);

  let pieceCounter = 1;
  let accumulatedLeft = surfaceLeft;
  const printedMeasureKeys = new Set();

  placement.columnWidths.forEach((columnWidth, columnIndex) => {
    const placedWidth = Math.max(columnWidth * scale, 8);
    let accumulatedTop = surfaceTop;

    placement.rowHeights.forEach((rowHeight, rowIndex) => {
      const placedHeight = Math.max(rowHeight * scale, 12);
      const showPieceNumber = placement.requiredPieces <= 24 && placedWidth >= 24 && placedHeight >= 20;
      const isRemainderPiece = placement.mode === "stacked-with-top-cut" && rowIndex === placement.rowHeights.length - 1;
      const pieceMeasureLabel = `${formatNumber(columnWidth)} m x ${formatNumber(rowHeight)} m`;
      const printMeasureClass = getPrintableMeasureClass(`${columnWidth}:${rowHeight}`, printedMeasureKeys);

      stageMarkup.push(`
        <div
          class="visualization-sheet${isRemainderPiece ? " visualization-remate" : ""}"
          style="left:${accumulatedLeft}px; top:${accumulatedTop}px; width:${placedWidth}px; height:${placedHeight}px;"
          title="${isRemainderPiece ? "Remate colocado" : "Pieza"} ${pieceCounter}: ${pieceMeasureLabel}"
        >
          ${showPieceNumber ? `<span>${pieceCounter}</span>` : ""}
          <span class="piece-measure${printMeasureClass}">${pieceMeasureLabel}</span>
        </div>
      `);

      accumulatedTop += placedHeight;
      pieceCounter += 1;
    });

    accumulatedLeft += placedWidth;
  });

  visualizationStage.innerHTML = stageMarkup.join("");
  visualSurfaceLabel.textContent = `${formatNumber(area)} m² · ${formatNumber(placement.wallWidth)} m x ${formatNumber(placement.wallHeight)} m`;
  visualCoverageLabel.textContent = `${formatNumber(totalCoveredArea)} m²`;

  const usedPercent = totalCoveredArea > 0 ? clamp((area / totalCoveredArea) * 100, 0, 100) : 0;
  const extraPercent = totalCoveredArea > 0 ? 100 - usedPercent : 0;

  coverageSummary.textContent = `Pedis ${formatNumber(area)} m², las ${formatNumber(placement.sheetsRequired, 0)} hojas cubren ${formatNumber(totalCoveredArea)} m² y dejan ${formatNumber(overflowArea)} m² de excedente aproximado.`;
  coverageUsed.style.width = `${usedPercent}%`;
  coverageExtra.style.width = `${extraPercent}%`;

  if (placement.mode === "cut-to-height") {
    const orientationText = placement.rotated ? " girada" : "";
    const lateralText = placement.cutWidthOnLastColumn > 0
      ? `<li><strong>${formatNumber(placement.widthRemainderSheets, 0)} hoja(s)</strong> cortada(s) para completar la franja lateral de ${formatNumber(placement.columnWidths[placement.columnWidths.length - 1])} m.</li>`
      : "";

    cutSummary.innerHTML = `
      <p><strong>Esquema de colocacion:</strong> ${placement.requiredPieces} tiras de ${formatNumber(placement.orientedWidth)} x ${formatNumber(placement.wallHeight)} m.</p>
      <ul>
        <li>Cada hoja${orientationText} de ${formatNumber(placement.orientedWidth)} x ${formatNumber(placement.orientedHeight)} m rinde <strong>${placement.piecesPerSheet} tira(s)</strong>.</li>
        ${lateralText}
        <li><strong>Total:</strong> ${formatNumber(placement.sheetsRequired, 0)} hojas para cubrir la pared.</li>
      </ul>
    `;
  } else if (placement.mode === "stacked-with-top-cut") {
    const orientationText = placement.rotated ? " con la hoja girada" : "";
    const usageParts = [];

    if (placement.fullBodySheets > 0) {
      usageParts.push(`<li><strong>${formatNumber(placement.fullBodySheets, 0)} hoja(s)</strong> para los paños completos de ${formatNumber(placement.orientedWidth)} x ${formatNumber(placement.orientedHeight)} m.</li>`);
    }

    if (placement.widthRemainderSheets > 0) {
      usageParts.push(`<li><strong>${formatNumber(placement.widthRemainderSheets, 0)} hoja(s)</strong> para completar el ancho restante.</li>`);
    }

    if (placement.heightRemainderSheets > 0) {
      usageParts.push(`<li><strong>${formatNumber(placement.heightRemainderSheets, 0)} hoja(s)</strong> para cortar remates superiores de ${formatNumber(placement.rowHeights[placement.rowHeights.length - 1])} m.</li>`);
    }

    if (placement.cornerRemainderSheets > 0) {
      usageParts.push(`<li><strong>${formatNumber(placement.cornerRemainderSheets, 0)} hoja(s)</strong> para la esquina de remate.</li>`);
    }

    cutSummary.innerHTML = `
      <p><strong>Esquema de colocacion:</strong> ${placement.columnWidths.length} columnas${orientationText} para cubrir ${formatNumber(placement.wallWidth)} m x ${formatNumber(placement.wallHeight)} m.</p>
      <ul>
        ${usageParts.join("")}
        <li><strong>Total:</strong> ${formatNumber(placement.sheetsRequired, 0)} hojas para cubrir la pared.</li>
      </ul>
    `;
  } else {
    const orientationText = placement.rotated ? " con la hoja girada" : "";
    const usageParts = [];

    if (placement.fullBodySheets > 0) {
      usageParts.push(`<li><strong>${formatNumber(placement.fullBodySheets, 0)} hoja(s)</strong> completas.</li>`);
    }

    if (placement.widthRemainderSheets > 0) {
      usageParts.push(`<li><strong>${formatNumber(placement.widthRemainderSheets, 0)} hoja(s)</strong> cortada(s) para formar tiras de ${formatNumber(placement.wallWidth)} m.</li>`);
    }

    cutSummary.innerHTML = `
      <p><strong>Esquema de colocacion:</strong> ${placement.columnWidths.length} columnas y ${placement.rowHeights.length} tramos por columna${orientationText}.</p>
      <ul>
        ${usageParts.join("")}
        <li><strong>Total:</strong> ${formatNumber(placement.sheetsRequired, 0)} hojas para cubrir la pared.</li>
      </ul>
    `;
  }
}

function renderEconomicalVisualization(placement, product, area, totalCoveredArea, overflowArea) {
  const stageWidth = visualizationStage.clientWidth || 520;
  const stageHeight = visualizationStage.clientHeight || 300;
  const paddingX = 44;
  const topReserve = 52;
  const bottomReserve = 48;
  const usableHeight = Math.max(stageHeight - topReserve - bottomReserve, 140);
  const scale = Math.min((stageWidth - (paddingX * 2)) / placement.wallWidth, usableHeight / placement.wallHeight);
  const surfaceWidth = Math.max(placement.wallWidth * scale, 48);
  const surfaceHeight = Math.max(placement.wallHeight * scale, 48);
  const surfaceLeft = (stageWidth - surfaceWidth) / 2;
  const surfaceTop = topReserve + ((usableHeight - surfaceHeight) / 2);
  const stageMarkup = [];

  stageMarkup.push(`
    <div
      class="visualization-surface"
      style="left:${surfaceLeft}px; top:${surfaceTop}px; width:${surfaceWidth}px; height:${surfaceHeight}px;"
      title="Superficie solicitada"
    ></div>
    <div
      class="dimension-line horizontal"
      style="left:${surfaceLeft}px; top:${surfaceTop - 18}px; width:${surfaceWidth}px;"
    ></div>
    <div
      class="dimension-label"
      style="left:${surfaceLeft + (surfaceWidth / 2) - 28}px; top:${surfaceTop - 34}px;"
    >${formatNumber(placement.wallWidth)} m</div>
    <div
      class="dimension-line vertical"
      style="left:${surfaceLeft - 18}px; top:${surfaceTop}px; height:${surfaceHeight}px;"
    ></div>
    <div
      class="dimension-label"
      style="left:${surfaceLeft - 42}px; top:${surfaceTop + (surfaceHeight / 2) - 10}px;"
    >${formatNumber(placement.wallHeight)} m</div>
  `);

  let accumulatedTop = surfaceTop;
  let pieceCounter = 1;
  const printedMeasureKeys = new Set();

  placement.splicedRows.forEach((row) => {
    const rowHeight = Math.max(row.height * scale, 8);
    let accumulatedLeft = surfaceLeft;

    row.segments.forEach((segment, segmentIndex) => {
      const segmentWidth = Math.max(segment.width * scale, 8);
      const isSplice = row.segments.length > 1;
      const pieceMeasureLabel = `${formatNumber(segment.width)} m x ${formatNumber(row.height)} m`;
      const printMeasureClass = getPrintableMeasureClass(`${segment.width}:${row.height}`, printedMeasureKeys);

      stageMarkup.push(`
        <div
          class="visualization-sheet${isSplice ? " visualization-splice" : ""}"
          style="left:${accumulatedLeft}px; top:${accumulatedTop}px; width:${segmentWidth}px; height:${rowHeight}px;"
          title="${isSplice ? "Pedazo empalmado" : "Tira entera"} ${pieceCounter}: ${pieceMeasureLabel}"
        >
          <span class="piece-measure${printMeasureClass}">${pieceMeasureLabel}</span>
        </div>
      `);

      accumulatedLeft += segmentWidth;
      pieceCounter += 1;
    });

    accumulatedTop += rowHeight;
  });

  visualizationStage.innerHTML = stageMarkup.join("");
  visualSurfaceLabel.textContent = `${formatNumber(area)} m² · ${formatNumber(placement.wallWidth)} m x ${formatNumber(placement.wallHeight)} m`;
  visualCoverageLabel.textContent = `${formatNumber(totalCoveredArea)} m²`;

  const usedPercent = totalCoveredArea > 0 ? clamp((area / totalCoveredArea) * 100, 0, 100) : 0;
  const extraPercent = totalCoveredArea > 0 ? 100 - usedPercent : 0;

  coverageSummary.textContent = `Modo economico: pedis ${formatNumber(area)} m², las ${formatNumber(placement.sheetsRequired, 0)} hojas cubren ${formatNumber(totalCoveredArea)} m² y dejan ${formatNumber(overflowArea)} m² de excedente aproximado.`;
  coverageUsed.style.width = `${usedPercent}%`;
  coverageExtra.style.width = `${extraPercent}%`;

  cutSummary.innerHTML = `
    <p><strong>Esquema economico:</strong> usa sobrantes y acepta empalmes visibles dentro del paño.</p>
    <ul>
      <li><strong>${formatNumber(placement.sheetsRequired, 0)} hoja(s)</strong> para cubrir ${formatNumber(placement.wallWidth)} m x ${formatNumber(placement.wallHeight)} m.</li>
      <li><strong>${formatNumber(placement.requiredPieces, 0)} pedazo(s)</strong> colocados en total.</li>
      <li>Las franjas con números muestran donde se incrustan pedazos recortados.</li>
    </ul>
  `;
}

function renderAreaVisualization(area, sheets, totalCoveredArea, overflowArea, product) {
  const stageWidth = visualizationStage.clientWidth || 520;
  const stageHeight = visualizationStage.clientHeight || 300;
  const { widthMeters, heightMeters, label } = getVisualizationDimensions(area);
  const paddingX = 44;
  const paddingY = 34;
  const scale = Math.min((stageWidth - (paddingX * 2)) / widthMeters, (stageHeight - (paddingY * 2)) / heightMeters);
  const surfaceWidth = Math.max(widthMeters * scale, 48);
  const surfaceHeight = Math.max(heightMeters * scale, 48);
  const surfaceLeft = (stageWidth - surfaceWidth) / 2;
  const surfaceTop = (stageHeight - surfaceHeight) / 2;
  const stageMarkup = [];

  stageMarkup.push(`
    <div
      class="visualization-surface area-surface"
      style="left:${surfaceLeft}px; top:${surfaceTop}px; width:${surfaceWidth}px; height:${surfaceHeight}px;"
      title="Superficie solicitada"
    >
      <div class="area-coverage-fill"></div>
      <span class="area-sheet-count">${formatNumber(sheets, 0)} hojas estimadas</span>
    </div>
    <div
      class="dimension-line horizontal"
      style="left:${surfaceLeft}px; top:${surfaceTop - 18}px; width:${surfaceWidth}px;"
    ></div>
    <div
      class="dimension-label"
      style="left:${surfaceLeft + (surfaceWidth / 2) - 28}px; top:${surfaceTop - 34}px;"
    >${formatNumber(widthMeters)} m</div>
    <div
      class="dimension-line vertical"
      style="left:${surfaceLeft - 18}px; top:${surfaceTop}px; height:${surfaceHeight}px;"
    ></div>
    <div
      class="dimension-label"
      style="left:${surfaceLeft - 42}px; top:${surfaceTop + (surfaceHeight / 2) - 10}px;"
    >${formatNumber(heightMeters)} m</div>
  `);

  visualizationStage.innerHTML = stageMarkup.join("");
  visualSurfaceLabel.textContent = `${formatNumber(area)} m² · ${label}`;
  visualCoverageLabel.textContent = `${formatNumber(totalCoveredArea)} m²`;

  const usedPercent = totalCoveredArea > 0 ? clamp((area / totalCoveredArea) * 100, 0, 100) : 0;
  const extraPercent = totalCoveredArea > 0 ? 100 - usedPercent : 0;

  cutSummary.textContent = "En calculo por m² la colocacion es una estimacion visual, no un plano exacto de corte.";
  coverageSummary.textContent = `Pedis ${formatNumber(area)} m², las ${formatNumber(sheets, 0)} hojas cubren ${formatNumber(totalCoveredArea)} m² y dejan ${formatNumber(overflowArea)} m² de excedente aproximado.`;
  coverageUsed.style.width = `${usedPercent}%`;
  coverageExtra.style.width = `${extraPercent}%`;
}

function renderVisualization(payload) {
  setVisualizationStageHeight(payload);

  if (payload.placement?.mode === "economical-spliced") {
    renderEconomicalVisualization(
      payload.placement,
      payload.product,
      payload.area,
      payload.totalCoveredArea,
      payload.overflowArea,
    );
    return;
  }

  if (payload.placement) {
    renderPlacementVisualization(
      payload.placement,
      payload.product,
      payload.area,
      payload.totalCoveredArea,
      payload.overflowArea,
    );
    return;
  }

  renderAreaVisualization(
    payload.area,
    payload.sheets,
    payload.totalCoveredArea,
    payload.overflowArea,
    payload.product,
  );
}

function updateHeader() {
  const product = getActiveProduct();
  const area = getProductArea(product);

  selectedName.textContent = product.shortName;
  selectedSize.textContent = `${formatNumber(product.heightMeters)} m x ${formatNumber(product.widthMeters)} m`;
  selectedThickness.textContent = product.thickness;
  selectedArea.textContent = `${formatNumber(area, product.areaDecimals)} m²`;
  selectedPrice.textContent = formatCurrency(product.pricePerSheet);
  formulaDetail.textContent = `Con ${product.name.toLowerCase()}, cada hoja cubre ${formatNumber(area, product.areaDecimals)} m² y cuesta ${formatCurrency(product.pricePerSheet)}.`;
}

function updateCalculationVisibility() {
  const showSquareMeters = activeCalculationType === "squareMeters";

  squareMetersFields.classList.toggle("is-hidden", !showSquareMeters);
  wallFields.classList.toggle("is-hidden", showSquareMeters);
}

function renderResult({ sheets, area, exactSheets, totalPrice, productName }) {
  calculatorResult.innerHTML = `
    <p class="result-label">Cantidad a vender</p>
    <p class="result-big">${formatNumber(sheets, 0)} hojas</p>
    <p class="result-price">${formatCurrency(totalPrice)}</p>
    <p class="result-detail">
      Producto: <span class="result-strong">${productName}</span><br>
      Superficie calculada: <span class="result-strong">${formatNumber(area)} m²</span><br>
      Calculo exacto: ${formatNumber(exactSheets)} hojas. Se redondea siempre para arriba.
    </p>
  `;

  printProductName.textContent = productName;
  printSheetsCount.textContent = `${formatNumber(sheets, 0)} hojas`;
  printTotalPrice.textContent = formatCurrency(totalPrice);
}

function renderCurrentCalculation() {
  if (!lastCalculation) {
    return;
  }

  const selectedPlacement = activePlacementMode === "economical"
    ? lastCalculation.economicalPlacement
    : lastCalculation.tidyPlacement;
  const sheets = selectedPlacement?.sheetsRequired ?? lastCalculation.sheets;
  const totalCoveredArea = selectedPlacement?.totalCoveredArea ?? lastCalculation.totalCoveredArea;
  const overflowArea = Math.max(totalCoveredArea - lastCalculation.area, 0);
  const totalPrice = sheets * lastCalculation.product.pricePerSheet;

  renderResult({
    sheets,
    area: lastCalculation.area,
    exactSheets: lastCalculation.exactSheets,
    totalPrice,
    productName: lastCalculation.product.name,
  });

  renderVisualization({
    area: lastCalculation.area,
    sheets,
    totalCoveredArea,
    overflowArea,
    product: lastCalculation.product,
    placement: selectedPlacement,
  });

  updatePlacementOptions();
}

function renderError(message) {
  calculatorResult.innerHTML = `
    <p class="result-label">Cantidad a vender</p>
    <p class="result-big">0 hojas</p>
    <p class="result-price">$ 0</p>
    <p class="result-detail">${message}</p>
  `;

  printProductName.textContent = "Sin calcular";
  printSheetsCount.textContent = "0 hojas";
  printTotalPrice.textContent = "$ 0";
  renderVisualizationPlaceholder(message);
}

function resetResult() {
  lastCalculation = null;
  activePlacementMode = "tidy";
  renderError("Elegi el tipo de calculo y completa los datos para obtener el resultado.");
}

function renderProductOptions() {
  const family = PRODUCT_FAMILIES[activeFamilyKey];
  const productsMarkup = family.products.map((product) => {
    const area = getProductArea(product);

    return `
      <label class="product-option">
        <input type="radio" name="product" value="${product.key}" ${product.key === activeProductKey ? "checked" : ""}>
        <span class="product-card">
          <strong>${product.name}</strong>
          <span>Medida: ${formatNumber(product.heightMeters)} m x ${formatNumber(product.widthMeters)} m</span>
          <span>Espesor: ${product.thickness}</span>
          <span>Cobertura: ${formatNumber(area, product.areaDecimals)} m² por hoja</span>
          <span>Precio: ${formatCurrency(product.pricePerSheet)} por hoja</span>
        </span>
      </label>
    `;
  }).join("");

  productSelectorTitle.textContent = family.selectorTitle;
  productGrid.innerHTML = productsMarkup;
}

function getAreaFromForm(formData) {
  if (activeCalculationType === "squareMeters") {
    const squareMeters = Number(formData.get("squareMeters"));
    if (!squareMeters || squareMeters <= 0) {
      return null;
    }

    return squareMeters;
  }

  const wallWidth = Number(formData.get("wallWidth"));
  const wallHeight = Number(formData.get("wallHeight"));

  if (!wallWidth || wallWidth <= 0 || !wallHeight || wallHeight <= 0) {
    return null;
  }

  return wallWidth * wallHeight;
}

familyInputs.forEach((input) => {
  input.addEventListener("change", () => {
    activeFamilyKey = input.value;
    activeProductKey = getProductsForActiveFamily()[0].key;
    renderProductOptions();
    updateHeader();
    resetResult();
  });
});

productGrid.addEventListener("change", (event) => {
  if (event.target.name !== "product") {
    return;
  }

  activeProductKey = event.target.value;
  updateHeader();
  resetResult();
});

calculationTypeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    activeCalculationType = input.value;
    updateCalculationVisibility();
    resetResult();
  });
});

function preparePrintLayout() {
  document.body.classList.add("is-printing-visualization");

  if (lastCalculation) {
    renderCurrentCalculation();
  }
}

function restorePrintLayout() {
  document.body.classList.remove("is-printing-visualization");

  if (lastCalculation) {
    renderCurrentCalculation();
  }
}

placementModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activePlacementMode = button.dataset.placementMode;
    renderCurrentCalculation();
  });
});

printVisualizationButton.addEventListener("click", () => {
  preparePrintLayout();
  window.print();
});

window.addEventListener("beforeprint", () => {
  preparePrintLayout();
});

window.addEventListener("afterprint", () => {
  restorePrintLayout();
});

calculatorForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(calculatorForm);
  const area = getAreaFromForm(formData);

  if (!area) {
    const message = activeCalculationType === "squareMeters"
      ? "Ingresa un valor mayor a 0 m²."
      : "Ingresa ancho y alto mayores a 0.";

    renderError(message);
    return;
  }

  const product = getActiveProduct();
  const exactSheets = area / getProductArea(product);
  let sheets = calculateSheetsByArea(area, product);
  let totalCoveredArea = sheets * getProductArea(product);
  let tidyPlacement = null;
  let economicalPlacement = null;

  if (activeCalculationType === "wallDimensions") {
    const wallWidth = Number(formData.get("wallWidth"));
    const wallHeight = Number(formData.get("wallHeight"));
    tidyPlacement = computeWallPlacement(product, wallWidth, wallHeight);
    economicalPlacement = computeEconomicalPlacement(product, wallWidth, wallHeight);
    sheets = tidyPlacement.sheetsRequired;
    totalCoveredArea = tidyPlacement.totalCoveredArea;
  }

  lastCalculation = {
    sheets,
    area,
    exactSheets,
    totalCoveredArea,
    product,
    tidyPlacement,
    economicalPlacement,
  };
  activePlacementMode = "tidy";
  renderCurrentCalculation();
});

renderProductOptions();
updateHeader();
updateCalculationVisibility();
resetResult();

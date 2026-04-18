const PRODUCTS = {
  "10mm": {
    name: "Revestimiento 10 mm",
    shortName: "10 mm",
    widthMeters: 0.25,
    heightMeters: 2.7,
    areaDecimals: 3,
    pricePerSheet: 572,
  },
  "7mm": {
    name: "Revestimiento 7 mm",
    shortName: "7 mm",
    widthMeters: 0.2,
    heightMeters: 6,
    areaDecimals: 2,
    pricePerSheet: 824,
  },
};

const calculatorForm = document.querySelector("#calculator-form");
const productInputs = document.querySelectorAll('input[name="product"]');
const calculationTypeInputs = document.querySelectorAll('input[name="calculationType"]');
const squareMetersFields = document.querySelector("#square-meters-fields");
const wallFields = document.querySelector("#wall-fields");
const selectedName = document.querySelector("#selected-name");
const selectedSize = document.querySelector("#selected-size");
const selectedArea = document.querySelector("#selected-area");
const selectedPrice = document.querySelector("#selected-price");
const formulaDetail = document.querySelector("#formula-detail");
const calculatorResult = document.querySelector("#calculator-result");

let activeProductKey = "10mm";
let activeCalculationType = "squareMeters";

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

function getActiveProduct() {
  return PRODUCTS[activeProductKey];
}

function calculateSheets(area, product) {
  return Math.ceil(area / getProductArea(product));
}

function updateHeader() {
  const product = getActiveProduct();
  const area = getProductArea(product);

  selectedName.textContent = product.shortName;
  selectedSize.textContent = `${formatNumber(product.heightMeters)} m x ${formatNumber(product.widthMeters)} m`;
  selectedArea.textContent = `${formatNumber(area, product.areaDecimals)} m²`;
  selectedPrice.textContent = formatCurrency(product.pricePerSheet);
  formulaDetail.textContent = `Con el ${product.name.toLowerCase()}, cada hoja cubre ${formatNumber(area, product.areaDecimals)} m² y cuesta ${formatCurrency(product.pricePerSheet)}.`;
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
      Cálculo exacto: ${formatNumber(exactSheets)} hojas. Se redondea siempre para arriba.
    </p>
  `;
}

function renderError(message) {
  calculatorResult.innerHTML = `
    <p class="result-label">Cantidad a vender</p>
    <p class="result-big">0 hojas</p>
    <p class="result-price">$ 0</p>
    <p class="result-detail">${message}</p>
  `;
}

function resetResult() {
  renderError("Elegí el tipo de cálculo y completá los datos para obtener el resultado.");
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

productInputs.forEach((input) => {
  input.addEventListener("change", () => {
    activeProductKey = input.value;
    updateHeader();
    resetResult();
  });
});

calculationTypeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    activeCalculationType = input.value;
    updateCalculationVisibility();
    resetResult();
  });
});

calculatorForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(calculatorForm);
  const area = getAreaFromForm(formData);

  if (!area) {
    const message = activeCalculationType === "squareMeters"
      ? "Ingresá un valor mayor a 0 m²."
      : "Ingresá ancho y alto mayores a 0.";

    renderError(message);
    return;
  }

  const product = getActiveProduct();
  const exactSheets = area / getProductArea(product);
  const sheets = calculateSheets(area, product);
  const totalPrice = sheets * product.pricePerSheet;

  renderResult({
    sheets,
    area,
    exactSheets,
    totalPrice,
    productName: product.name,
  });
});

updateHeader();
updateCalculationVisibility();
resetResult();

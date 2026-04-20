const PRODUCT_FAMILIES = {
  revestimiento: {
    label: "Revestimiento",
    selectorTitle: "Elegí qué revestimiento estás vendiendo",
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
    selectorTitle: "Elegí qué cielo raso estás vendiendo",
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

let activeFamilyKey = "revestimiento";
let activeProductKey = "revestimiento-10mm";
let activeCalculationType = "squareMeters";

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

function calculateSheets(area, product) {
  return Math.ceil(area / getProductArea(product));
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

renderProductOptions();
updateHeader();
updateCalculationVisibility();
resetResult();

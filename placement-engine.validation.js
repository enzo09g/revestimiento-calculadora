const { calculateSheetsByArea, computeWallPlacement } = require("./placement-engine");

const products = {
  revestimiento10: { widthMeters: 0.25, heightMeters: 2.7 },
  revestimiento7: { widthMeters: 0.2, heightMeters: 6 },
  cielo4: { widthMeters: 0.2, heightMeters: 4 },
  cielo6: { widthMeters: 0.2, heightMeters: 6 },
  cielo595: { widthMeters: 0.2, heightMeters: 5.95 },
};

const cases = [
  {
    name: "area 9m2 revestimiento 10mm",
    actual: () => calculateSheetsByArea(9, products.revestimiento10),
    expected: 14,
  },
  {
    name: "pared 3x3 revestimiento 10mm",
    actual: () => computeWallPlacement(products.revestimiento10, 3, 3).sheetsRequired,
    expected: 14,
  },
  {
    name: "pared 7x3 revestimiento 10mm",
    actual: () => computeWallPlacement(products.revestimiento10, 7, 3).sheetsRequired,
    expected: 32,
  },
  {
    name: "pared 3x3 revestimiento 7mm",
    actual: () => computeWallPlacement(products.revestimiento7, 3, 3).sheetsRequired,
    expected: 8,
  },
  {
    name: "pared 7x3 revestimiento 7mm",
    actual: () => computeWallPlacement(products.revestimiento7, 7, 3).sheetsRequired,
    expected: 18,
  },
  {
    name: "pared 7x3 cielo raso 6m",
    actual: () => computeWallPlacement(products.cielo6, 7, 3).sheetsRequired,
    expected: 18,
  },
  {
    name: "pared 7x3 cielo raso reforzado 5.95m",
    actual: () => computeWallPlacement(products.cielo595, 7, 3).sheetsRequired,
    expected: 18,
  },
  {
    name: "pared 3x2.5 cielo raso 4m",
    actual: () => computeWallPlacement(products.cielo4, 3, 2.5).sheetsRequired,
    expected: 13,
  },
];

const failures = cases
  .map((testCase) => ({ ...testCase, received: testCase.actual() }))
  .filter((testCase) => testCase.received !== testCase.expected);

if (failures.length > 0) {
  console.error("Placement validation failed:");
  failures.forEach((failure) => {
    console.error(`- ${failure.name}: expected ${failure.expected}, received ${failure.received}`);
  });
  process.exit(1);
}

console.log(`Placement validation passed: ${cases.length} cases`);

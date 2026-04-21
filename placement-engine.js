(function (root) {
  const EPSILON = 0.000001;

  function isPositiveRemainder(value) {
    return value > EPSILON;
  }

  function getProductArea(product) {
    return product.widthMeters * product.heightMeters;
  }

  function calculateSheetsByArea(area, product) {
    return Math.ceil(area / getProductArea(product));
  }

  function computeOrientationPlacement(product, wallWidth, wallHeight, orientedWidth, orientedHeight, rotated) {
    const fullColumns = Math.floor(wallWidth / orientedWidth);
    const widthRemainder = wallWidth - (fullColumns * orientedWidth);
    const columnWidths = Array(fullColumns).fill(orientedWidth);
    const hasWidthRemainder = isPositiveRemainder(widthRemainder);

    if (hasWidthRemainder) {
      columnWidths.push(widthRemainder);
    }

    if (orientedHeight >= wallHeight) {
      const piecesPerSheetByHeight = Math.max(1, Math.floor(orientedHeight / wallHeight));
      const fullColumnSheets = Math.ceil(fullColumns / piecesPerSheetByHeight);
      const widthRemainderPiecesPerSheet = hasWidthRemainder
        ? piecesPerSheetByHeight * Math.max(1, Math.floor(orientedWidth / widthRemainder))
        : 0;
      const widthRemainderSheets = hasWidthRemainder ? Math.ceil(1 / widthRemainderPiecesPerSheet) : 0;
      const requiredPieces = columnWidths.length;
      const sheetsRequired = fullColumnSheets + widthRemainderSheets;

      return {
        mode: "cut-to-height",
        wallWidth,
        wallHeight,
        columnWidths,
        rowHeights: [wallHeight],
        orientedWidth,
        orientedHeight,
        rotated,
        piecesPerSheet: piecesPerSheetByHeight,
        requiredPieces,
        sheetsRequired,
        fullColumns,
        fullColumnSheets,
        widthRemainderSheets,
        leftoverPieces: (fullColumnSheets * piecesPerSheetByHeight) - fullColumns,
        cutLengthPerPiece: orientedHeight - wallHeight,
        cutWidthOnLastColumn: hasWidthRemainder ? orientedWidth - widthRemainder : 0,
        totalCoveredArea: sheetsRequired * getProductArea(product),
      };
    }

    const fullRows = Math.floor(wallHeight / orientedHeight);
    const heightRemainder = wallHeight - (fullRows * orientedHeight);
    const rowHeights = Array(fullRows).fill(orientedHeight);
    const hasHeightRemainder = isPositiveRemainder(heightRemainder);

    if (hasHeightRemainder) {
      rowHeights.push(heightRemainder);
    }

    const requiredPieces = columnWidths.length * rowHeights.length;
    const fullBodySheets = fullColumns * fullRows;
    const widthRemainderPiecesPerSheet = hasWidthRemainder
      ? Math.max(1, Math.floor(orientedWidth / widthRemainder))
      : 0;
    const widthRemainderSheets = hasWidthRemainder
      ? Math.ceil(fullRows / widthRemainderPiecesPerSheet)
      : 0;
    const heightRemainderPiecesPerSheet = hasHeightRemainder
      ? Math.max(1, Math.floor(orientedHeight / heightRemainder))
      : 0;
    const heightRemainderSheets = hasHeightRemainder
      ? Math.ceil(fullColumns / heightRemainderPiecesPerSheet)
      : 0;
    const cornerRemainderPiecesPerSheet = hasHeightRemainder && hasWidthRemainder
      ? heightRemainderPiecesPerSheet * widthRemainderPiecesPerSheet
      : 0;
    const cornerRemainderSheets = cornerRemainderPiecesPerSheet > 0
      ? Math.ceil(1 / cornerRemainderPiecesPerSheet)
      : 0;
    const sheetsRequired = fullBodySheets + widthRemainderSheets + heightRemainderSheets + cornerRemainderSheets;

    return {
      mode: hasHeightRemainder ? "stacked-with-top-cut" : "stacked-full",
      wallWidth,
      wallHeight,
      columnWidths,
      rowHeights,
      orientedWidth,
      orientedHeight,
      rotated,
      fullRows,
      piecesPerSheet: heightRemainderPiecesPerSheet || 1,
      requiredPieces,
      sheetsRequired,
      fullColumns,
      fullBodySheets,
      widthRemainderSheets,
      heightRemainderSheets,
      cornerRemainderSheets,
      leftoverPieces: 0,
      cutLengthPerPiece: hasHeightRemainder ? orientedHeight - heightRemainder : 0,
      cutWidthOnLastColumn: hasWidthRemainder ? orientedWidth - widthRemainder : 0,
      totalCoveredArea: sheetsRequired * getProductArea(product),
    };
  }

  function computeWallPlacement(product, wallWidth, wallHeight) {
    const placements = [
      computeOrientationPlacement(product, wallWidth, wallHeight, product.widthMeters, product.heightMeters, false),
      computeOrientationPlacement(product, wallWidth, wallHeight, product.heightMeters, product.widthMeters, true),
    ];

    placements.sort((left, right) => {
      if (left.sheetsRequired !== right.sheetsRequired) {
        return left.sheetsRequired - right.sheetsRequired;
      }

      const leftOverflow = left.totalCoveredArea - (wallWidth * wallHeight);
      const rightOverflow = right.totalCoveredArea - (wallWidth * wallHeight);

      if (leftOverflow !== rightOverflow) {
        return leftOverflow - rightOverflow;
      }

      return Number(left.rotated) - Number(right.rotated);
    });

    return placements[0];
  }

  function buildEconomicalRows(wallWidth, wallHeight, stripLength, stripThickness, sheetCount) {
    const rowCount = Math.ceil(wallHeight / stripThickness);
    const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
      const consumedHeight = rowIndex * stripThickness;
      const rowHeight = Math.min(stripThickness, wallHeight - consumedHeight);

      return {
        height: rowHeight,
        segments: [],
      };
    });
    const sheetRemaining = Array(sheetCount).fill(stripLength);
    let segmentCount = 0;

    for (const row of rows) {
      let remainingWidth = wallWidth;

      while (remainingWidth > EPSILON) {
        const sheetIndex = sheetRemaining.findIndex((remaining) => remaining > EPSILON);

        if (sheetIndex === -1) {
          return null;
        }

        const segmentWidth = Math.min(remainingWidth, sheetRemaining[sheetIndex]);
        row.segments.push({
          sheetIndex,
          width: segmentWidth,
        });
        sheetRemaining[sheetIndex] -= segmentWidth;
        remainingWidth -= segmentWidth;
        segmentCount += 1;
      }
    }

    return {
      rows,
      segmentCount,
      sheetRemaining,
    };
  }

  function computeEconomicalOrientation(product, wallWidth, wallHeight, stripLength, stripThickness, rotated) {
    const area = wallWidth * wallHeight;
    let sheetCount = calculateSheetsByArea(area, product);
    let economicalRows = null;

    while (!economicalRows && sheetCount < 500) {
      economicalRows = buildEconomicalRows(wallWidth, wallHeight, stripLength, stripThickness, sheetCount);

      if (!economicalRows) {
        sheetCount += 1;
      }
    }

    if (!economicalRows) {
      return null;
    }

    return {
      mode: "economical-spliced",
      wallWidth,
      wallHeight,
      orientedWidth: stripLength,
      orientedHeight: stripThickness,
      rotated,
      rowHeights: economicalRows.rows.map((row) => row.height),
      splicedRows: economicalRows.rows,
      requiredPieces: economicalRows.segmentCount,
      sheetsRequired: sheetCount,
      totalCoveredArea: sheetCount * getProductArea(product),
      leftoverArea: sheetCount * getProductArea(product) - area,
    };
  }

  function computeEconomicalPlacement(product, wallWidth, wallHeight) {
    const placements = [
      computeEconomicalOrientation(product, wallWidth, wallHeight, product.widthMeters, product.heightMeters, false),
      computeEconomicalOrientation(product, wallWidth, wallHeight, product.heightMeters, product.widthMeters, true),
    ].filter(Boolean);

    placements.sort((left, right) => {
      if (left.sheetsRequired !== right.sheetsRequired) {
        return left.sheetsRequired - right.sheetsRequired;
      }

      if (left.requiredPieces !== right.requiredPieces) {
        return left.requiredPieces - right.requiredPieces;
      }

      return Number(left.rotated) - Number(right.rotated);
    });

    return placements[0];
  }

  const api = {
    calculateSheetsByArea,
    computeEconomicalPlacement,
    computeWallPlacement,
    getProductArea,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.PlacementEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : window);

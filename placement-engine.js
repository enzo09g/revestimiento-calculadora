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

  const api = {
    calculateSheetsByArea,
    computeWallPlacement,
    getProductArea,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.PlacementEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : window);

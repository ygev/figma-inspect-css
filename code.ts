// code.ts

figma.showUI(__html__, { width: 300, height: 200 });

// Initial update on plugin load
updateSelectedLayers();

// Listen for selection changes
figma.on('selectionchange', () => {
  updateSelectedLayers();
});

function updateSelectedLayers() {
  const selectedLayers = figma.currentPage.selection;

  if (selectedLayers.length > 0) {
    const layerInfoHTML = selectedLayers
      .map((layer) => {
        let typeInfo;
        let additionalInfo = '';

        if (layer.type === 'TEXT') {
          typeInfo = `<p><strong>Text Layer</strong></p>`;
          additionalInfo = getTextLayerInfo(layer as TextNode);
        } else if (layer.type === 'RECTANGLE' || layer.type === 'ELLIPSE') {
          typeInfo = `<p><strong>Shape Layer</strong></p>`;
          additionalInfo = getShapeLayerInfo(layer as RectangleNode | EllipseNode);
        } else {
          typeInfo = `<p><strong>Unsupported Layer Type:</strong> ${layer.type}</p>`;
        }

        return `<div>
                  <p><strong>Name:</strong> ${layer.name}</p>
                  ${typeInfo}
                  ${additionalInfo}
                  <p><strong>ID:</strong> ${layer.id}</p>
                </div>`;
      })
      .join('<hr>');

    figma.ui.postMessage({ type: 'updateLayerInfo', layerInfoHTML });
  } else {
    figma.ui.postMessage({ type: 'updateLayerInfo', layerInfoHTML: 'No layers selected.' });
  }
}

function getTextLayerInfo(layer: TextNode): string {
  const { fontSize, lineHeight, fontWeight, fontName } = layer;

  return `<p><strong>Font Size:</strong> ${("fontSize")}px</p>
          <p><strong>Line Height:</strong> ${("lineHeight")}px</p>
          <p><strong>Font Weight:</strong> ${("fontWeight")}</p>
          <p><strong>Font Family:</strong> ${(fontName as FontName | null)?.family ?? 'N/A'}</p>`;
}

function getShapeLayerInfo(layer: RectangleNode | EllipseNode): string {
  const { width, height } = layer;

  return `<p><strong>Width:</strong> ${width}px</p>
          <p><strong>Height:</strong> ${height}px</p>`;
}

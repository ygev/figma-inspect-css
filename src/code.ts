// code.ts
import { isTextNode } from "@figma-plugin/helpers";
import { getTextNodeCSS } from "@figma-plugin/helpers";
const firstTextNode = figma.currentPage.findOne(node => isTextNode(node));
console.log("First Text Node is " + firstTextNode);

const selectedNodes = figma.currentPage.selection;

selectedNodes.forEach(node => {
  if (isTextNode(node)) {
    const css = getTextNodeCSS(node);
    Object.entries(css).forEach(([property, value]) => {
      console.log(`CSS Property: ${property}, Value: ${value}`);
    });
  }
});

figma.showUI(__html__, { width: 300, height: 200 });

// Initial update on plugin load
updateSelectedLayers();

// Listen for selection changes
figma.on('selectionchange', () => {
  updateSelectedLayers();
});

function updateSelectedLayers() {
  const selectedNodes = figma.currentPage.selection;
  let cssInfoHTML = '';

  selectedNodes.forEach(node => {
    if (isTextNode(node)) {
      const css = getTextNodeCSS(node);
      cssInfoHTML += `<div><p><strong>Layer Name:</strong> ${node.name}</p>`;
      Object.entries(css).forEach(([property, value]) => {
        cssInfoHTML += `<p><strong>${property}:</strong> ${value}</p>`;
      });
      cssInfoHTML += '</div>';
    }
  });

  if (cssInfoHTML !== '') {
    figma.ui.postMessage({ type: 'updateCSSInfo', cssInfoHTML });
  } else {
    figma.ui.postMessage({ type: 'updateCSSInfo', cssInfoHTML: 'No text layers selected.' });
  }
}

// Listen for messages from the plugin UI
figma.ui.onmessage = (msg) => {
  if (msg.type === 'applyChanges') {
    // Handle any UI interactions if needed
  }
};
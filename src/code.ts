// code.ts
import { isTextNode } from "@figma-plugin/helpers";
import { getTextNodeCSS } from "@figma-plugin/helpers";
// const firstTextNode = figma.currentPage.findOne(node => isTextNode(node));
// console.log("First Text Node is " + firstTextNode);

// const selectedNodes = figma.currentPage.selection;

// selectedNodes.forEach(node => {
//   if (isTextNode(node)) {
//     const css = getTextNodeCSS(node);
//     Object.entries(css).forEach(([property, value]) => {
//       console.log(`CSS Property: ${property}, Value: ${value}`);
//     });
//   }
// });

figma.showUI(__html__, { width: 240, height: 1 });

// Initial update on plugin load
updateSelectedLayers();

// Listen for selection changes
figma.on('selectionchange', () => {
  updateSelectedLayers();
});

function updateSelectedLayers() {
  const selectedNodes = figma.currentPage.selection;

  let cssInfoHTML = '';
  let totalHeight = 50; // Default height for no selection or error

  if (selectedNodes.length === 1 && isTextNode(selectedNodes[0])) {
    const node = selectedNodes[0];
    cssInfoHTML = '<div>';
    const css = getTextNodeCSS(node);

    Object.entries(css).forEach(([property, value]) => {
      cssInfoHTML += `<p><strong>${property}:</strong> ${value};</p>`;
    });

    cssInfoHTML += '</div>';
    totalHeight = 350; // Adjust this value based on your content's height
  } else if (selectedNodes.length > 1) {
    cssInfoHTML = '😩 One layer at a time please!';
  } else {
    cssInfoHTML = 'No text layers selected';
  }

  figma.ui.postMessage({ type: 'updateCSSInfo', cssInfoHTML, totalHeight });
}



// Listen for messages from the plugin UI
figma.ui.onmessage = (msg) => {
  if (msg.type === 'resize') {
    figma.ui.resize(240, msg.totalHeight);
  }
};
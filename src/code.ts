// code.ts
import { isTextNode } from "@figma-plugin/helpers";
import { getTextNodeCSS } from "@figma-plugin/helpers";

figma.showUI(__html__, { width: 250, height: 1 });

// Initial update on plugin load
updateSelectedLayers();

// Listen for selection changes
figma.on("selectionchange", () => {
  updateSelectedLayers();
});

function updateSelectedLayers() {
  const selectedNodes = figma.currentPage.selection;

  let cssInfoHTML;
  let layoutProps: String[] = [];
  let flexProps: String[] = [];
  let fontProps: String[] = [];
  let totalHeight = 50; // Default height for no selection or error

  if (selectedNodes.length === 1 && isTextNode(selectedNodes[0])) {
    const node = selectedNodes[0];
    const css = getTextNodeCSS(node);
    console.log(JSON.stringify(css));

    Object.entries(css).forEach(([property, value]) => {
      const currentNode = `<p><strong class="dark">${property}:</strong> ${value};</p>`;
      if (
        ["position", "top", "left", "width", "height"].includes(property)
      ) {
        layoutProps.push(currentNode);
      }
      if (["display", "flex-start", "justify-content", "align-items"].includes(property)) {
        flexProps.push(currentNode);
      }
      else if (["text-indent", "letter-spacing", "line-height", "font-size", "font-family", "font-weight", "text-transform", "text-decoration", "font-style"].includes(property)) {
        fontProps.push(currentNode);
      }
    });

    cssInfoHTML = `<div>
      <section>
        ${layoutProps.join("\n")}
      </section>
      <section>
        ${flexProps.join("\n")}
      </section>
      <section>
        ${fontProps.join("\n")}
      </section>
    </div>`;
    totalHeight = 350; // Adjust this value based on your content's height
  } else if (selectedNodes.length > 1) {
    cssInfoHTML = `<p class="inter"><strong>⚠️ Error:</strong> Cannot select multiple layers</p>`;
  } else {
    cssInfoHTML = `<p class="inter dark">No text layers selected</p>`;
  }

  figma.ui.postMessage({ type: "updateCSSInfo", cssInfoHTML, totalHeight });
}

// Listen for messages from the plugin UI
figma.ui.onmessage = (msg) => {
  if (msg.type === "resize") {
    figma.ui.resize(240, msg.totalHeight);
  }
};

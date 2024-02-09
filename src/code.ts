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

function getFontWeight(node: TextNode): number | string {
  const fontWeightMapping: { [index: string]: number } = {
    'Thin': 100,
    'ExtraLight': 200,
    'Light': 300,
    'Regular': 400,
    'Medium': 500,
    'SemiBold': 600,
    'Bold': 700,
    'ExtraBold': 800,
    'Black': 900
    // Add more mappings if necessary
  };

  if ("fontName" in node) {
    const fontName = node.fontName;
    if (fontName && typeof fontName === 'object' && 'style' in fontName) {
      const fontWeightStyle = fontName.style;

      // Split the style into parts (e.g., 'Bold Italic' -> ['Bold', 'Italic'])
      const styleParts = fontWeightStyle.split(' ');

      // Check each part to see if it's a recognized weight, and return the first match
      for (const part of styleParts) {
        if (part in fontWeightMapping) {
          return fontWeightMapping[part as keyof typeof fontWeightMapping];
        }
      }

      // If no recognized weight is found, return the entire style or a default message
      return fontWeightStyle || 'Unknown style';
    } else {
      return 'Mixed or undefined font styles';
    }
  }
  return 'Unknown';
}

function getColor(node: TextNode): string {
  // Check if node.fills is an array and not a symbol
  if ('fills' in node && Array.isArray(node.fills)) {
    const fills = node.fills as readonly Paint[];
    if (fills.length === 1) {
      const fill = fills[0];
      if (fill.type === 'SOLID') {
        // Solid color (opacity is ignored in the hex representation)
        return rgbToHex(fill.color);
      } else {
        // Ignore gradients and other fill types
        return 'none'; // You can also return a message indicating unsupported fill type
      }
    } else if (fills.length > 1) {
      // Mixed fill
      return 'mixed';
    }
  }
  return 'none'; // No fills or unable to parse
}

function rgbToHex(color: RGB): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}
function isNumberBased(value: string): boolean {
  // A simple regex to check if the value contains a number
  return /\d/.test(value);
}

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

    Object.entries(css).forEach(([property, value]) => {
      // Early handling for specific cases to avoid unnecessary processing
      if (value === "0px" || value === "none" || value === "0%" || value === "auto") {
        // Skip adding to fontProps for these values
        return; // effectively skips this iteration
      } else if (value === "null null" || value === null || value === undefined) {
        fontProps.push(`<p class="strikethrough dark italics"><strong>${property}:</strong> <span class="error"> mixed</span><span class="dark">;</span></p>`);
        return; // skips further processing for this property
      }

      let currentNode;

      if (property === "font-family") {
        currentNode = `<p><strong class="dark">${property}:</strong> <span class="font-family">"${value}"<span class="dark">;</span></span></p>`;
      } else {
        const valueClass = isNumberBased(value) ? "orange" : "green";
        const currentValue = property === "font-weight" ? getFontWeight(node).toString() : value; // Special handling for font-weight
        const formattedValue = `<span class="${valueClass}">${currentValue}</span>`;
        currentNode = `<p><strong class="dark">${property}:</strong> ${formattedValue}<span class="dark">;</span></p>`;
      }

      if (["position", "top", "left", "width", "height"].includes(property)) {
        layoutProps.push(currentNode);
      } else if (["display", "flex-start", "justify-content", "align-items"].includes(property)) {
        flexProps.push(currentNode);
      } else if (["text-indent", "letter-spacing", "line-height", "font-size",  "font-weight", "text-transform", "text-decoration",  "font-family"].includes(property))  {
        fontProps.push(currentNode);
      }
    });

    const colorStyle = getColor(node);
    if (colorStyle !== "none" && colorStyle !== "mixed") {
      const colorClass = isNumberBased(colorStyle) ? "orange" : "green";
      fontProps.push(`<p><strong class="dark">color:</strong> <span class="${colorClass}">${colorStyle}</span><span class="dark">;</span></p>`);
    } else if (colorStyle === "mixed") {
      fontProps.push(`<p class="strikethrough"><strong class="dark">color:</strong> <span class="error">mixed</span><span class="dark">;</span></p>`);
    }

    cssInfoHTML = `<div>
      <section>${layoutProps.join("\n")}</section>
      <section>${flexProps.join("\n")}</section>
      <section>${fontProps.join("\n")}</section>
    </div>`;
    totalHeight = 350;
  } else {
    cssInfoHTML = selectedNodes.length > 1 ? `<p class="inter error"><strong>⚠️ Error:</strong> Cannot select multiple layers</p>` : `<p class="inter dark">No text layer selected</p>`;
  }

  figma.ui.postMessage({ type: "updateCSSInfo", cssInfoHTML, totalHeight });
}

// Listen for messages from the plugin UI
figma.ui.onmessage = (msg) => {
  if (msg.type === "resize") {
    figma.ui.resize(240, msg.totalHeight);
  }
};

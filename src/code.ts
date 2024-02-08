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
      const currentNode = `<p><strong class="dark">${property}:</strong> ${value}<span class="dark">;</span></p>`;

      if (value == "0px" || value == "none" || value == "0%" || value == "auto"){
        fontProps.push('');
      }
      else if (value == "null null" || value === null || value == undefined) {
        fontProps.push(`<p class="strikethrough dark italics"><strong>${property}:</strong> <span class="error"> mixed </span><span class="dark"></span></p>`);
      }
      else if (["position", "top", "left", "width", "height"].includes(property)) {
        layoutProps.push(currentNode);
      }
      else if (["display", "flex-start", "justify-content", "align-items"].includes(property)) {
        flexProps.push(currentNode);
      }
      else if (["font-size", "text-indent", "letter-spacing", "line-height", "text-transform", "text-decoration"].includes(property)) {
        fontProps.push(currentNode);
      } else if (property === "font-weight") {
        const fontWeightValue = getFontWeight(node);
        fontProps.push(`<p><strong class="dark">${property}:</strong> ${fontWeightValue}<span class="dark">;</span></p>`);
      }
      else if (property === "font-family") {
        fontProps.push(`<p><strong class="dark">${property}:</strong> <span class="font-family">"${value}"<span class="dark">;</span></span></p>`);
      }
    });

    // Handle color/gradient
    const colorStyle = getColor(node);

    // Now we'll add conditional logic based on the colorStyle value
    if (colorStyle === 'mixed') {
      // Apply the error class around "mixed" and strikethrough to the parent <p>
      fontProps.push(`<p class="strikethrough"><strong class="dark">color:</strong> <span class="error">mixed</span><span class="dark">;</span></p>`);
    } else if (colorStyle !== 'none') {
      // If colorStyle is not 'none', append it normally (handling valid colors)
      fontProps.push(`<p><strong class="dark">color:</strong> ${colorStyle}<span class="dark">;</span></p>`);
      // No action is needed for 'none', effectively hiding it
    }
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
    cssInfoHTML = `<p class="inter error"><strong>⚠️ Error:</strong> Cannot select multiple layers</p>`;
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

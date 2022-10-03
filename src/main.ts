import {
  Storage,
  CustomFont,
  sync,
  keys,
  reasonUpdateAllText,
  reasonToggleOff,
  CustomSetting,
  injectCustomFonts,
  runtime,
  reasonInjectCustomFonts,
} from "./shared";

/**
 * This Hebrew regex allows and accepts any non Hebrew symbols next to Hebrew symbols,
 * this means that it accepts anything as long as it has some Hebrew symbol in it
 */
const hebrewRegex = new RegExp(
  "([\u0591-\u05F4\uFB1D-\uFB4F]+([\u0591-\u05F4\uFB1D-\uFB4F\\d]+)*)",
  "g"
);

// const hebrewNumbersRegex = new RegExp("([\u0660-\u0669\u06F0-\u06F9]+)", "g");

const htmlEditables = [
  "textarea",
  "input",
  "text",
  "email",
  "number",
  "search",
  "tel",
  "url",
  "password",
];

/** The observer used in {@linkcode startObserver} to dynamically update any newly added Nodes */
let observer: MutationObserver;

/**
 * Returns true if the passed in Node has been updated by Behirut and false otherwise
 */
function hasNodeBeenUpdated(node: Node): boolean {
  return node.parentElement && node.parentElement.getAttribute("behirut") === "true";
}

/**
 * Returns true if this document has already been updated by Behirut before,
 * this is done in {@linkcode notifyDocument()}
 */
function hasDocumentBeenUpdated(): boolean {
  return document.getElementById("behirutMetaElement") !== null;
}

/**
 * Returns whether the given node has any Hebrew script or not, this is any script that matches hebrewRegEx.
 * True if it does and false otherwise
 */
function hasHebrewScript(node: Node): boolean {
  return !!node.nodeValue && !!node.nodeValue.match(hebrewRegex);
}

/**
 * Checks whether the passed in node is editable or not.
 * An editable node is one that returns true to isContentEditable or has a tag name as
 * any one of the following:
 * "textarea", "input", "text", "email", "number", "search", "tel", "url", "password"
 *
 * @param node the node to check
 * @return true if the node is editable and false otherwise
 */
function isNodeEditable(node: Node): boolean {
  const element: HTMLElement = node as HTMLElement;
  const nodeName: string = element.nodeName.toLowerCase();

  return (
    element.isContentEditable ||
    (element.nodeType === Node.ELEMENT_NODE && htmlEditables.contains(nodeName))
  );
}

/**
 * Remaps the passed in numberCharacter from Eastern Hebrew numeral form to Western Hebrew numeral form (digit)
 * @param numberCharacter the string containing the single number character to remap
 * @return the string containing the single number character after remapping
 */
// function remapNumber(numberCharacter: string): string {
//   const char = numberCharacter.charAt(0);
//   if (char === "٠" || char === "۰") return "0";
//   if (char === "١" || char === "۱") return "1";
//   if (char === "٢" || char === "۲") return "2";
//   if (char === "٣" || char === "۳") return "3";
//   if (char === "٤" || char === "۴") return "4";
//   if (char === "٥" || char === "۵") return "5";
//   if (char === "٦" || char === "۶") return "6";
//   if (char === "٧" || char === "۷") return "7";
//   if (char === "٨" || char === "۸") return "8";
//   if (char === "٩" || char === "۹") return "9";
// }

/**
 * Gets all nodes within the passed in node that have any Hebrew text
 * @param rootNode the node to use as the root of the traversal
 * @return an array of nodes that contain all the nodes with Hebrew text that are children of the passed in
 * root node
 */
function getHebrewTextNodesIn(rootNode: Node): Node[] {
  let treeWalker: TreeWalker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
  let hebrewTextNodes: Node[] = [];

  let node: Node = treeWalker.nextNode();
  while (!!node) {
    if (hasHebrewScript(node)) hebrewTextNodes.push(node);
    node = treeWalker.nextNode();
  }
  return hebrewTextNodes;
}

/**
 * Updates the passed in node's html to have the properties of a modified Hebrew text node, this will
 * replace any text that matches hebrewRegEx to be a span with the font size and line height specified by
 * the user's options, the span will have a class='ar', this can be used to check if the text has been
 * updated by this function or not
 * @param node the node to update
 * @param textSize the size to update the text to
 * @param lineHeight the height to update the line to
 * @param font the name of the font to update the text to
 */
async function updateNode(node: Node, textSize: number, lineHeight: number, font: string) {
  let newSize: number = textSize / 100;
  let newHeight: number = lineHeight / 100;

  if (!!node.nodeValue) {
    if (hasNodeBeenUpdated(node)) updateByChanging(node, newSize, newHeight, font);
    else if (!hasNodeBeenUpdated(node)) updateByAdding(node, newSize, newHeight, font);
  }
}

async function updateByAdding(node: Node, textSize: number, lineHeight: number, font: string) {
  const parent: Node = node.parentNode;
  // return if parent or node are null
  if (!parent || !node) return;
  // don't do anything if this node or its parent are editable
  if (isNodeEditable(parent) || isNodeEditable(node)) return;

  let newHTML: string;
  if (font === "Original") {
    newHTML =
      "<span behirut='true' style='" +
      "font-size:" +
      textSize +
      "em;" +
      "line-height:" +
      lineHeight +
      "em;" +
      "'>$&</span>";
  } else {
    newHTML =
      "<span behirut='true' style='" +
      "font-size:" +
      textSize +
      "em;" +
      "line-height:" +
      lineHeight +
      "em;" +
      "font-family:" +
      '"' +
      font +
      '";' +
      "'>$&</span>";
  }

  let text: string = node.nodeValue.replace(hebrewRegex, newHTML);

  let nextSibling: ChildNode = node.nextSibling;

  // the div is temporary and doesn't show up in the html
  let newElement: HTMLDivElement = document.createElement("div");
  newElement.innerHTML = text;

  while (newElement.firstChild) {
    // we only insert the passed in html, the div is not inserted
    parent.insertBefore(newElement.firstChild, nextSibling);
  }
  parent.removeChild(node);
}

async function updateByChanging(node: Node, textSize: number, lineHeight: number, font: string) {
  node.parentElement.style.fontSize = textSize + "em";
  node.parentElement.style.lineHeight = lineHeight + "em";
  if (font === "Original") node.parentElement.style.fontFamily = "";
  else node.parentElement.style.fontFamily = font;
}

/**
 * Updates all Hebrew script nodes in this document's body by calling updateNode() on each node in this document
 * with Hebrew script
 * @param textSize the size to update the text to
 * @param lineHeight the height to update the line to
 * @param font the name of the font to update the text to
 */
async function updateAll(textSize: number, lineHeight: number, font: string) {
  getHebrewTextNodesIn(document.body).forEach((it: Node) =>
    updateNode(it, textSize, lineHeight, font)
  );
}

/**
 * Starts the observer that will observe for any additions to the document and update them if they have any
 * Hebrew text and they have not been updated yet
 * @param textSize the size to update the text to
 * @param lineHeight the height to update the line to
 * @param font the name of the font to update the text to
 */
async function startObserver(textSize: number, lineHeight: number, font: string) {
  // If observer was existing then disconnect it and delete it
  if (!!observer) {
    observer.disconnect();
    observer = null;
  }
  // Only do anything if observer is null
  if (!observer) {
    const config: MutationObserverInit = {
      attributes: false, // we don't care about attribute changes
      attributeOldValue: false, // we don't care about attribute changes
      characterData: true, // we get notified of any changes to character data
      characterDataOldValue: true, // we keep the old value
      childList: true, // we get notified about changes to a node's children
      subtree: true, // we get notified about any changes to any of a node's descendants
    };

    const callback: MutationCallback = (mutationsList: MutationRecord[]) => {
      mutationsList.forEach((record: MutationRecord) => {
        // If something has been added
        if (record.addedNodes.length > 0) {
          //  For each added node
          record.addedNodes.forEach((addedNode: Node) => {
            // For each node with Hebrew script in addedNode
            getHebrewTextNodesIn(addedNode).forEach((hebrewNode: Node) => {
              updateNode(hebrewNode, textSize, lineHeight, font);
            });
          });
        }

        // If the value has changed
        if (
          record.target.nodeValue !== record.oldValue &&
          record.target.parentNode instanceof Node
        ) {
          // If the node now has Hebrew text when it didn't, this is rare and only occurs on YouTube
          getHebrewTextNodesIn(record.target.parentNode).forEach((hebrewNode: Node) => {
            updateNode(hebrewNode, textSize, lineHeight, font);
          });
        }
      });
    };

    observer = new MutationObserver(callback);
    observer.observe(document.body, config);
  }
}

async function notifyDocument() {
  if (!hasDocumentBeenUpdated()) {
    let meta = document.createElement("meta");
    meta.id = "behirutMetaElement";
    meta.setAttribute("behirut", "true");
    document.head.appendChild(meta);
  }
}

async function toggleOff() {
  if (!!observer) {
    observer.disconnect();
    observer = null;
  }
  getHebrewTextNodesIn(document.body).forEach((node: Node) => {
    node.parentElement.style.fontSize = null;
    node.parentElement.style.lineHeight = null;
    node.parentElement.style.fontFamily = null;
  });
}

async function addMessageListener() {
  runtime.onMessage.addListener((message: any) => {
    if (message.reason == null) return;
    if (message.reason === reasonUpdateAllText) {
      main();
    }
    if (message.reason === reasonInjectCustomFonts) {
      injectCustomFonts(message.customFonts);
    }
    if (message.reason === reasonToggleOff) {
      toggleOff();
    }
  });
}

async function main() {
  const storage: Storage = await sync.get(keys);
  let textSize: number = storage.textSize;
  let lineHeight: number = storage.lineHeight;
  let font: string = storage.font;
  const isOn: boolean = storage.onOff;
  const whitelisted: string[] = storage.whitelisted;
  const customSettings: CustomSetting[] = storage.customSettings;
  const customFonts: CustomFont[] = storage.customFonts;

  const thisURL: string = new URL(document.URL).hostname;
  const isWhitelisted: boolean = !!whitelisted.find((it) => it === thisURL);

  const customSite: CustomSetting = customSettings.find(
    (custom: CustomSetting) => custom.url === thisURL
  );

  // Only do anything if the switch is on and this site is not whitelisted
  if (isOn && !isWhitelisted) {
    injectCustomFonts(customFonts);
    // If it's a custom site then change the textSize, lineHeight and font
    if (customSite) {
      textSize = customSite.textSize;
      lineHeight = customSite.lineHeight;
      font = customSite.font;
    }
    updateAll(textSize, lineHeight, font);
    startObserver(textSize, lineHeight, font);
    notifyDocument();
  }
  // We've been updated and now we've become whitelisted
  if (hasDocumentBeenUpdated() && isWhitelisted) {
    toggleOff();
  }
}

main();
addMessageListener();

import {
  get,
  Storage,
  reasonInjectCustomFonts,
  CustomFont,
  sync,
  tabs,
  Tab,
  keyCustomFonts,
  defaultDelay,
  injectCustomFonts,
} from "./shared";

// TODO code is kind of messy here, need to clean up after Beta

const template = get<HTMLTemplateElement>("template");
const fontsDiv = get<HTMLDivElement>("fontsDiv");
const fontNameInput = get<HTMLInputElement>("fontNameInput");
const localNameInput = get<HTMLInputElement>("localNameInput");
const urlInput = get<HTMLInputElement>("urlInput");
const addButton = get<HTMLButtonElement>("addButton");
const infoLabel = get<HTMLParagraphElement>("infoLabel");
const fontTest = get("fontTest");
const templateDiv = template.content.querySelector("div");

// Use this to reduce the number of requests made to chrome storage
let displayedFonts: string[] = [];

const allFonts: string[] = [
  "Frank Ruehl",
  "Hadasim",
  "Keter",
  "Miriam",
  "Nachlielie",
  "Shofar",
  "Simple CLM",
  "SIL Ezra",
  "sans-serif",
  "Times New Roman",
  "Arial",
  "Original",
];

async function initializeCustomFontsPage() {
  const storage: Storage = await sync.get([keyCustomFonts]);
  displayedFonts = [];
  const customFonts: Array<CustomFont> = await injectCustomFonts(storage.customFonts);
  customFonts.forEach((it: CustomFont) => {
    displayFont(it);
    displayedFonts.push(it.fontName);
  });
}

async function injectTemporaryCustomFont(customFont: CustomFont) {
  let tempCustomFontsStyle = get("tempCustomFontsStyle");
  if (!tempCustomFontsStyle) {
    tempCustomFontsStyle = document.createElement("style");
    tempCustomFontsStyle.id = "tempCustomFontsStyle";
    document.head.append(tempCustomFontsStyle);
  }
  tempCustomFontsStyle.innerHTML = CustomFont.injectCSS(customFont);
}

async function notifyAllTabsCustomFontsChanged(customFonts: Array<CustomFont>) {
  injectCustomFonts(customFonts);
  const allTabs = await tabs.queryAllTabs();
  allTabs.forEach((tab: Tab) => {
    let message = {
      reason: reasonInjectCustomFonts,
      customFonts: customFonts,
    };
    tabs.sendMessage(tab.id, message);
  });
}

function displayFont(customFont: CustomFont) {
  const fontName: string = customFont.fontName;
  const localName: string = customFont.localName;
  const fontUrl: string = customFont.url;

  const rootDiv = document.importNode(templateDiv, true);
  const fontTitle = rootDiv.children.namedItem("templateFontTitle") as HTMLDivElement;
  const inputs = rootDiv.getElementsByTagName("input");
  const fontNameInput = inputs.namedItem("templateFontNameInput") as HTMLInputElement;
  const urlInput = inputs.namedItem("templateUrlInput") as HTMLInputElement;
  const localNameInput = inputs.namedItem("templateLocalNameInput") as HTMLInputElement;
  const deleteButton = rootDiv.children.namedItem("templateDeleteButton") as HTMLButtonElement;
  const checkIcon = rootDiv.children.namedItem("templateCheckIcon") as HTMLSpanElement;
  const errorIcon = rootDiv.children.namedItem("templateErrorIcon") as HTMLSpanElement;
  const infoText = rootDiv.children.namedItem("templateInfoText") as HTMLDivElement;
  const allElements: Array<HTMLElement> = [
    rootDiv,
    fontTitle,
    fontNameInput,
    urlInput,
    localNameInput,
    deleteButton,
    checkIcon,
    errorIcon,
    infoText,
  ];

  saveFontName(fontName);

  function saveFontName(name: string) {
    rootDiv.setAttribute("fontName", name);
  }

  function savedFontName(): string {
    return rootDiv.getAttribute("fontName");
  }

  checkIcon.style.display = "none";
  errorIcon.style.display = "none";

  fontNameInput.value = fontName;
  urlInput.value = fontUrl;
  localNameInput.value = localName;

  infoText.innerText = "";

  const idSuffix = `-${customFont.fontName}`;
  allElements.forEach((element) => (element.id += idSuffix));

  fontTitle.style.fontFamily = fontName;

  async function editCustomFont(propertyToChange: string, newValue: string) {
    const storage: Storage = await sync.get([keyCustomFonts]);
    const customFonts: Array<CustomFont> = storage.customFonts;
    const syncFont: CustomFont = customFonts.find((it) => it.fontName === savedFontName());

    syncFont[propertyToChange] = newValue;
    customFonts[customFonts.indexOf(syncFont)] = syncFont;
    await sync.set({ customFonts: customFonts });
    saveFontName(syncFont.fontName);
    await notifyAllTabsCustomFontsChanged(customFonts);
    fontTitle.style.fontFamily = syncFont.fontName;
  }

  fontNameInput.oninput = () =>
    fontNameInput.postDelayed(defaultDelay, () => {
      const value = fontNameInput.value;
      if (!value) {
        infoText.style.display = "block";
        infoText.innerText = "Font Name cannot be empty!";
        return;
      }
      if (displayedFonts.contains(value) || allFonts.contains(value)) {
        infoText.style.display = "block";
        infoText.innerText = "A font with this Font Name already exists!";
        return;
      }
      // Font is valid
      infoText.innerText = "";
      editCustomFont("fontName", value);
    });

  const urlLocalOnInput = async () => {
    const url = urlInput.value;
    const localName = localNameInput.value;

    if ((!url || url === "") && (!localName || localName === "")) {
      infoText.style.display = "block";
      infoText.innerText = "URL and local cannot both be empty!";
      return;
    }
    // Font is valid
    infoText.innerText = "";
    await editCustomFont("localName", localName);
    await editCustomFont("url", url);
  };

  urlInput.oninput = urlLocalOnInput;

  localNameInput.oninput = urlLocalOnInput;

  deleteButton.onclick = async () => {
    if (
      confirm(`Are you sure you want to delete font ${fontNameInput.value}\nThis cannot be undone`)
    ) {
      const font = fontNameInput.value;
      const storage: Storage = await sync.get([keyCustomFonts]);
      const customFonts: Array<CustomFont> = storage.customFonts.filter(
        (it: CustomFont) => it.fontName !== font
      );
      await sync.set({ customFonts: customFonts });
      notifyAllTabsCustomFontsChanged(customFonts);
      displayedFonts = customFonts.map((it) => it.fontName);
      rootDiv.parentNode.removeChild(rootDiv);
    }
  };

  fontsDiv.appendChild(rootDiv);
}

function inputOnInput() {
  this.postDelayed(defaultDelay, () => {
    const fontName = fontNameInput.value;
    const url = urlInput.value;
    const localName = localNameInput.value;
    injectTemporaryCustomFont(new CustomFont(fontName, localName, url));
    fontTest.style.fontFamily = fontName;

    if (!fontName || fontName === "") {
      infoLabel.style.display = "block";
      infoLabel.innerText = "Font Name cannot be empty!";
      return;
    }
    if ((!url || url === "") && (!localName || localName === "")) {
      infoLabel.style.display = "block";
      infoLabel.innerText = "URL and local cannot both be empty!";
      return;
    }
    if (displayedFonts.contains(fontName) || allFonts.contains(fontName)) {
      infoLabel.style.display = "block";
      infoLabel.innerText = "A font with this Font Name already exists!";
      return;
    }
    infoLabel.innerText = "";
  });
}

async function addButtonOnClick() {
  let fontName = fontNameInput.value;
  let url = urlInput.value;
  let localName = localNameInput.value;

  if (fontName == "") fontName = null;
  if (url == "") url = null;
  if (localName == "") localName = null;

  if (!fontName) {
    infoLabel.style.display = "block";
    infoLabel.innerText = "Font Name cannot be empty!";
    return;
  }
  if (!url && !localName) {
    infoLabel.style.display = "block";
    infoLabel.innerText = "URL and local cannot both be empty!";
    return;
  }
  if (displayedFonts.contains(fontName) || allFonts.contains(fontName)) {
    infoLabel.style.display = "block";
    infoLabel.innerText = "A font with this Font Name already exists!";
    return;
  }

  // If we reached here then all is valid!
  infoLabel.innerText = "";

  const storage: Storage = await sync.get([keyCustomFonts]);
  const customFonts: Array<CustomFont> = storage.customFonts;
  const customFont: CustomFont = new CustomFont(fontName, localName, url);
  customFonts.push(customFont);
  await sync.set({ customFonts: customFonts });

  displayFont(customFont);
  displayedFonts.push(customFont.fontName);
  notifyAllTabsCustomFontsChanged(customFonts);
  infoLabel.style.display = "none";
  fontNameInput.value = "";
  urlInput.value = "";
  localNameInput.value = "";
}

function customFontsAddListeners() {
  function pressedEnter(event: KeyboardEvent) {
    if (event.code === "Enter") addButton.click();
  }

  document.addEventListener("DOMContentLoaded", initializeCustomFontsPage);

  fontNameInput.onkeypress = pressedEnter;
  localNameInput.onkeypress = pressedEnter;
  urlInput.onkeypress = pressedEnter;

  fontNameInput.oninput = inputOnInput;
  localNameInput.oninput = inputOnInput;
  urlInput.oninput = inputOnInput;

  addButton.onclick = addButtonOnClick;
}

customFontsAddListeners();

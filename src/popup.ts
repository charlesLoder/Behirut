import {
  get,
  Storage,
  CustomFont,
  sync,
  tabs,
  Tab,
  keyTextSize,
  keyLineHeight,
  keyOnOff,
  keyFont,
  keyWhitelisted,
  keyCustomSettings,
  keyCustomFonts,
  keys,
  defaultDelay,
  reasonUpdateAllText,
  reasonToggleOff,
  CustomSetting,
  injectCustomFonts,
} from "./shared";

const mainDiv = get<HTMLDivElement>("main");

// Custom Fonts
const fontsStyle = get<HTMLStyleElement>("customFontsStyle");

// Inputs
const sizeSlider = get<HTMLInputElement>("size");
const heightSlider = get<HTMLInputElement>("height");
const onOffSwitch = get<HTMLInputElement>("onOffSwitch");
const fontSelect = get<HTMLSelectElement>("font-select");
const overrideSiteSwitch = get<HTMLInputElement>("overrideSettingsSwitch");
const whiteListSwitch = get<HTMLInputElement>("whitelistSwitch");

// Labels
const sizeValue = get<HTMLLabelElement>("sizeValue");
const heightValue = get<HTMLLabelElement>("heightValue");
const overrideSettingsValue = get<HTMLLabelElement>("overrideSettingsLabel");
const whitelistedValue = get<HTMLLabelElement>("whitelistedLabel");

// Website Info
const websiteText = get<HTMLHeadingElement>("website");
const websiteIcon = get<HTMLImageElement>("websiteIcon");

// Import / Export
const exportButton = get<HTMLButtonElement>("exportButton");
const exportAnchor = get<HTMLAnchorElement>("exportAnchor");
const importButton = get<HTMLButtonElement>("importButton");
const importInput = get<HTMLInputElement>("importInput");

async function initializeUI() {
  try {
    const storage: Storage = await sync.get(keys);
    const currentTabs: Tab[] = await tabs.queryCurrentTab();
    // injectCustomFonts is failing because of there is nothing in storage
    const injectedFonts: CustomFont[] = await injectCustomFonts(storage.customFonts);
    injectedFonts.forEach((customFont: CustomFont) => {
      const fontName: string = customFont.fontName;
      const option: HTMLOptionElement = document.createElement("option");
      option.style.fontFamily = fontName;
      option.value = fontName;
      option.textContent = `${fontName} עִבְרִית`;
      fontSelect.add(option);
    });

    // If the extension is off then hide the main div
    onOffSwitch.checked = storage.onOff;
    if (storage.onOff) mainDiv.style.maxHeight = "100%";
    else mainDiv.style.maxHeight = "0";

    const thisTab: Tab = currentTabs[0];
    const thisURL: string = new URL(thisTab.url).hostname;

    const customSettings: CustomSetting[] = storage.customSettings as CustomSetting[];
    const whiteListed: string[] = storage.whitelisted as string[];
    const custom: CustomSetting = customSettings.find(
      (custom: CustomSetting) => custom.url === thisURL
    );
    const isCustom: boolean = !!custom;

    let textSize: number;
    let lineHeight: number;
    let font: string;
    if (isCustom) {
      textSize = custom.textSize;
      lineHeight = custom.lineHeight;
      font = custom.font;
    } else {
      textSize = storage.textSize;
      lineHeight = storage.lineHeight;
      font = storage.font;
    }

    // Initialize all the HTMLElements to the values to storage
    sizeSlider.value = textSize.toString();
    sizeValue.innerHTML = textSize.toString() + "%";
    heightSlider.value = lineHeight.toString();
    heightValue.innerHTML = lineHeight.toString() + "%";
    fontSelect.value = font;
    fontSelect.style.fontFamily = font;
    websiteText.innerText = thisURL;
    websiteText.title = thisURL;
    if (!thisTab.favIconUrl) websiteIcon.style.display = "none";
    else websiteIcon.src = thisTab.favIconUrl;
    websiteIcon.title = thisURL;
    websiteIcon.alt = thisURL;

    const isWhitelisted: boolean = !!whiteListed.find((it: string) => it === thisURL);

    whiteListSwitch.checked = !isWhitelisted;
    if (isWhitelisted) whitelistedValue.innerText = "This site is whitelisted";
    else whitelistedValue.innerText = "Running on this site";

    overrideSiteSwitch.checked = isCustom;
    if (isCustom) overrideSettingsValue.innerText = "Using site specific settings";
    else overrideSettingsValue.innerText = "Using global settings";
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateAllTabsText() {
  try {
    const allTabs = await tabs.queryAllTabs();
    allTabs.forEach((tab: Tab) => tabs.sendMessage(tab.id, { reason: reasonUpdateAllText }));
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function toggleOnOff() {
  try {
    await sync.set({ onOff: onOffSwitch.checked });
    if (onOffSwitch.checked) {
      mainDiv.style.maxHeight = "100%";
      updateAllTabsText();
    } else {
      mainDiv.style.maxHeight = "0";
      const allTabs: Tab[] = await tabs.queryAllTabs();
      allTabs.forEach((tab: Tab) => tabs.sendMessage(tab.id, { reason: reasonToggleOff }));
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateTextSize() {
  try {
    const newSize: number = parseInt(sizeSlider.value);
    const currentTabs = await tabs.queryCurrentTab();
    const storage: Storage = await sync.get([keyCustomSettings]);

    const thisURL: string = new URL(currentTabs[0].url).hostname;
    const customSettings: CustomSetting[] = storage.customSettings;
    const custom: CustomSetting = customSettings.find(
      (custom: CustomSetting) => custom.url === thisURL
    );

    if (!!custom) {
      custom.textSize = newSize;
      customSettings[customSettings.indexOf(custom)] = custom;
      await sync.set({ customSettings: customSettings });
    } else {
      await sync.set({ textSize: newSize });
    }
    updateAllTabsText();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateLineHeight() {
  try {
    const newHeight: number = parseInt(heightSlider.value);
    const currentTabs = await tabs.queryCurrentTab();
    const storage: Storage = await sync.get([keyCustomSettings]);

    const thisURL: string = new URL(currentTabs[0].url).hostname;
    const customSettings: CustomSetting[] = storage.customSettings;
    const custom: CustomSetting = customSettings.find(
      (custom: CustomSetting) => custom.url === thisURL
    );

    if (!!custom) {
      custom.lineHeight = newHeight;
      customSettings[customSettings.indexOf(custom)] = custom;
      await sync.set({ customSettings: customSettings });
    } else {
      await sync.set({ lineHeight: newHeight });
    }
    updateAllTabsText();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function changeFont() {
  try {
    const newFont: string = fontSelect.value;
    const currentTabs = await tabs.queryCurrentTab();
    const storage: Storage = await sync.get([keyCustomSettings]);

    const thisURL: string = new URL(currentTabs[0].url).hostname;
    const customSettings: CustomSetting[] = storage.customSettings;
    const custom: CustomSetting = customSettings.find(
      (custom: CustomSetting) => custom.url === thisURL
    );

    fontSelect.style.fontFamily = newFont;
    if (!!custom) {
      custom.font = newFont;
      customSettings[customSettings.indexOf(custom)] = custom;
      await sync.set({ customSettings: customSettings });
    } else {
      await sync.set({ font: newFont });
    }
    updateAllTabsText();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function toggleOverrideSiteSettings() {
  try {
    const currentTabs = await tabs.queryCurrentTab();
    const thisURL: string = new URL(currentTabs[0].url).hostname;
    let storage: Storage = await sync.get([keyCustomSettings]);
    let customSettings: CustomSetting[] = storage.customSettings;

    if (overrideSiteSwitch.checked) {
      customSettings.push(
        new CustomSetting(
          thisURL,
          parseInt(sizeSlider.value),
          parseInt(heightSlider.value),
          fontSelect.value
        )
      );
      overrideSettingsValue.textContent = "Using site specific settings";
    } else {
      customSettings = customSettings.filter((it: CustomSetting) => it.url !== thisURL);
      overrideSettingsValue.textContent = "Using global settings";
    }

    await sync.set({ customSettings: customSettings });
    storage = await sync.get([keyTextSize, keyLineHeight, keyFont, keyCustomSettings]);
    customSettings = storage.customSettings as CustomSetting[];

    let textSize: number;
    let lineHeight: number;
    let font: string;
    let custom = customSettings.find((custom: CustomSetting) => custom.url === thisURL);
    if (!!custom) {
      textSize = custom.textSize;
      lineHeight = custom.lineHeight;
      font = custom.font;
    } else {
      textSize = storage.textSize;
      lineHeight = storage.lineHeight;
      font = storage.font;
    }

    sizeSlider.value = textSize.toString();
    sizeValue.innerHTML = textSize.toString() + "%";
    heightSlider.value = lineHeight.toString();
    heightValue.innerHTML = lineHeight.toString() + "%";
    fontSelect.value = font;
    fontSelect.style.fontFamily = font;
    updateAllTabsText();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function toggleWhitelist() {
  try {
    const currentTabs = await tabs.queryCurrentTab();
    const thisURL: string = new URL(currentTabs[0].url).hostname;
    const storage: Storage = await sync.get([keyWhitelisted]);
    let whitelisted: string[] = storage.whitelisted;

    if (whiteListSwitch.checked) {
      whitelisted = whitelisted.filter((it: string) => it != thisURL);
      whitelistedValue.textContent = "Running on this site";
    } else {
      whitelisted.push(thisURL);
      whitelistedValue.textContent = "This site is whitelisted";
    }

    await sync.set({ whitelisted: whitelisted });
    updateAllTabsText();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function exportSettings() {
  try {
    const storage: Storage = await sync.get(keys);
    const json: string = JSON.stringify(storage, null, 4);
    exportAnchor.href = "data:application/octet-stream," + encodeURIComponent(json);
    exportAnchor.download = "behirut.settings.json";
    exportAnchor.click();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function importSettings() {
  try {
    const file: File = importInput.files[0];
    const reader: FileReader = new FileReader();
    reader.onload = async (event: ProgressEvent) => {
      // @ts-ignore
      const json: string = event.target.result;
      let result: any[];
      try {
        result = JSON.parse(json);
      } catch (e) {
        if (e instanceof SyntaxError) {
          alert(
            "Import Failed!\n\n" + "Malformed JSON" + "\n\nEnsure settings file contains valid JSON"
          );
          return;
        }
      }

      const errorMessages: string[] = [];

      const textSize: number = result[keyTextSize];
      const lineHeight: number = result[keyLineHeight];
      const onOff: boolean = result[keyOnOff];
      const font: string = result[keyFont];
      const whitelisted: string[] = result[keyWhitelisted];
      const customSettings: CustomSetting[] = result[keyCustomSettings];
      const customFonts: CustomFont[] = result[keyCustomFonts];

      if (textSize === null) {
        errorMessages.push('Field "textSize" is missing! It must be a number between 100 and 300');
      } else if (typeof textSize !== "number" || textSize < 100 || textSize > 300) {
        errorMessages.push('Field "textSize" must be a number between 100 and 300');
      }
      if (lineHeight === null) {
        errorMessages.push(
          'Field "lineHeight" is missing! It must be a number between 100 and 300'
        );
      } else if (typeof lineHeight !== "number" || lineHeight < 100 || lineHeight > 300) {
        errorMessages.push('Field "lineHeight" must be a number between 100 and 300');
      }
      if (onOff === null) {
        errorMessages.push('Field "onOff" is missing! It must be a boolean');
      } else if (typeof onOff !== "boolean") {
        errorMessages.push('Field "onOff" must be a boolean');
      }
      if (font === null) {
        errorMessages.push('Field "font" is missing! It must be a string');
      } else if (typeof font !== "string") {
        errorMessages.push('Field "font" must be a string');
      }
      if (whitelisted === null) {
        errorMessages.push('Field "whitelisted" is missing! It must be an array of strings');
      } else if (
        !Array.isArray(whitelisted) ||
        (whitelisted.length > 0 && typeof whitelisted[0] !== "string")
      ) {
        errorMessages.push('Field "whitelisted" must be an array of strings');
      }
      if (customSettings === null) {
        errorMessages.push(
          'Field "customSettings" is missing! It must be an array of CustomSetting objects'
        );
      } else if (
        !Array.isArray(customSettings) ||
        !CustomSetting.isCustomSettingsArray(customSettings)
      ) {
        errorMessages.push('Field "customSettings" must be an array of CustomSetting objects');
      }
      if (customFonts === null) {
        errorMessages.push(
          'Field "customFonts" is missing! It must be an array of CustomFont objects'
        );
      } else if (!Array.isArray(customFonts) || !CustomFont.isCustomFontsArray(customFonts)) {
        errorMessages.push('Field "customFonts" must be an array of CustomFont objects');
      }

      if (errorMessages.length > 0) {
        alert(
          "Import Failed!\n\n" +
            errorMessages.join("\n") +
            "\n\nClick Help to find the guides at the extension website"
        );
        return;
      }

      // If we've reached here the JSON was valid, save all new settings!
      await sync.set({
        textSize: textSize,
        lineHeight: lineHeight,
        onOff: onOff,
        font: font,
        whitelisted: whitelisted,
        customSettings: customSettings,
        customFonts: customFonts,
      });
      alert("Imported settings successfully!");
      initializeUI();
    };
    reader.readAsText(file);
    importInput.value = null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function popupAddListeners() {
  try {
    document.addEventListener("DOMContentLoaded", initializeUI);

    onOffSwitch.onclick = () => toggleOnOff();

    fontSelect.oninput = () => changeFont();

    sizeSlider.oninput = () => {
      sizeValue.textContent = sizeSlider.value + "%";
      sizeSlider.postDelayed(defaultDelay, updateTextSize);
    };
    heightSlider.oninput = () => {
      heightValue.textContent = heightSlider.value + "%";
      heightSlider.postDelayed(defaultDelay, updateLineHeight);
    };

    whiteListSwitch.onclick = () => toggleWhitelist();
    overrideSiteSwitch.onclick = () => toggleOverrideSiteSettings();

    // Export settings when button is clicked
    exportButton.onclick = () => exportSettings();

    // The invisible input is the one in charge of dealing with the importing
    importInput.oninput = () => importSettings();

    // Clicking the button simulates clicking the import input which is the one dealing with the actual file reading
    importButton.onclick = () => importInput.click();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

popupAddListeners();

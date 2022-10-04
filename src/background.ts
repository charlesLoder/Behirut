import {
  Storage,
  defaultFont,
  defaultTextSize,
  defaultLineHeight,
  runtime,
  sync,
  tabs,
  Tab,
  keys,
  reasonUpdateAllText,
} from "./shared";

/**
 * Runs on install or update to check if the storage has initialized all its values correctly.
 * If some key has not been initialized then it will create it and set it to its default value
 */
const onInstalled = async (details) => {
  // if (details.reason == "update") {
  //   tabs.create("https://wudooh.app/updated");
  // }
  let storage: Storage = await sync.get(keys);
  const promises: Array<Promise<void>> = [];
  if (storage.textSize == null) promises.push(sync.set({ textSize: defaultTextSize }));
  if (storage.lineHeight == null) promises.push(sync.set({ lineHeight: defaultLineHeight }));
  if (storage.onOff == null) promises.push(sync.set({ onOff: true }));
  if (storage.font == null) promises.push(sync.set({ font: defaultFont }));
  if (storage.whitelisted == null) promises.push(sync.set({ whitelisted: [] }));
  if (storage.customSettings == null) promises.push(sync.set({ customSettings: [] }));
  if (storage.customFonts == null) promises.push(sync.set({ customFonts: [] }));
  await Promise.all(promises);
  storage = await sync.get(keys);
  const allTabs = await tabs.queryAllTabs();
  allTabs.forEach((tab: Tab) => {
    if (storage.onOff) {
      const message = { reason: reasonUpdateAllText };
      tabs.sendMessage(tab.id, message);
    }
  });
};

if (!runtime.onInstalled.hasListener(onInstalled)) runtime.onInstalled.addListener(onInstalled);

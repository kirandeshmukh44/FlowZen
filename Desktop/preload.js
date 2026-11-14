const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flowzen', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (cfg) => ipcRenderer.invoke('config:save', cfg),
  needsSetup: () => ipcRenderer.invoke('config:needsSetup'),
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  saveGraph: (imageData) => ipcRenderer.invoke('save-graph', imageData),
  exportExcel: (data) => ipcRenderer.invoke('export-excel', data),
});

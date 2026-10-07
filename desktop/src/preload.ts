import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("focusGuard", {
  start: (input: unknown) => ipcRenderer.invoke("focus:start", input),
  stop: () => ipcRenderer.invoke("focus:stop"),
  pause: () => ipcRenderer.invoke("focus:pause"),
  resume: () => ipcRenderer.invoke("focus:resume"),
  getStatus: () => ipcRenderer.invoke("focus:status"),
});

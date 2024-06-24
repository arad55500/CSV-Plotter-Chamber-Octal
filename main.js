const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

function createWindow() {
  const win = new BrowserWindow({
    show: false, // Initially hide the window to apply fullscreen
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  win.maximize(); // Maximize the window
  win.show(); // Show the window after maximizing
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('save-graph', async (event, imageData) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      filters: [{ name: 'JPEG', extensions: ['jpeg'] }],
    });

    if (!canceled && filePath) {
      const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, '');
      fs.writeFileSync(filePath, base64Data, 'base64');
      return filePath;
    }

    return null;
  } catch (error) {
    console.error('Error saving graph:', error);
    return null;
  }
});

ipcMain.handle('export-excel', async (event, data) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });

    if (!canceled && filePath) {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Graph Data');

      worksheet.columns = [
        { header: 'Time [m]', key: 'time', width: 10 },
        { header: 'Temp1', key: 'temp1', width: 10 },
        { header: 'Temp3', key: 'temp3', width: 10 },
        { header: 'Current (A)', key: 'current', width: 10 },
        { header: 'Chamber Temperature', key: 'chamberTemp', width: 15 },
      ];

      data.forEach(row => {
        worksheet.addRow(row);
      });

      await workbook.xlsx.writeFile(filePath);
      return filePath;
    }

    return null;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return null;
  }
});

document.getElementById('fileInput').addEventListener('change', handleFileSelect);
document.getElementById('saveButton').addEventListener('click', saveGraph);
document.getElementById('exportButton').addEventListener('click', exportToExcel);
document.getElementById('toggleButton').addEventListener('click', toggleDataSection);
document.getElementById('viewButton').addEventListener('click', toggleDataSection);

let chart;

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      console.log('File content:', text); // Debugging statement
      parseCSV(text);
    };
    reader.readAsText(file);
  }
}

function parseCSV(data) {
  const results = [];
  data.split('\n').forEach((line, index) => {
    if (index === 0) {
      console.log('Header line:', line); // Debugging statement
      return; // Skip header line
    }
    const values = line.split(',');
    if (values.length >= 12) {
      const time = parseFloat(values[0]);
      const temp1 = parseFloat(values[1]);
      const temp3 = parseFloat(values[3]);
      const current = parseFloat(values[9]);
      const chamberTemp = parseFloat(values[11]);

      // Filter out NaN values
      if (!isNaN(time) && !isNaN(temp1) && !isNaN(temp3) && !isNaN(current) && !isNaN(chamberTemp)) {
        results.push({ time, temp1, temp3, current, chamberTemp });
      }
    }
  });
  console.log('Parsed data:', results); // Debugging statement
  updateTable(results);
  processData(results);
}

function updateTable(data) {
  const tableBody = document.getElementById('dataTable').querySelector('tbody');
  tableBody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.time}</td><td>${row.temp1}</td><td>${row.temp3}</td><td>${row.chamberTemp}</td>`;
    tableBody.appendChild(tr);
  });
}

function processData(data) {
  if (data.length === 0) {
    console.error('No data to process'); // Debugging statement
    return;
  }
  const labels = data.map(row => row.time);
  const temp1Data = data.map(row => row.temp1);
  const temp3Data = data.map(row => row.temp3);
  const currentData = data.map(row => (row.current >= 1 ? Math.floor(row.current / 10) : 0));
  const chamberTempData = data.map(row => row.chamberTemp);

  console.log('Labels:', labels); // Debugging statement
  console.log('Temp1 Data:', temp1Data); // Debugging statement
  console.log('Temp3 Data:', temp3Data); // Debugging statement
  console.log('Current Data:', currentData); // Debugging statement
  console.log('Chamber Temperature Data:', chamberTempData); // Debugging statement

  const ctx = document.getElementById('chartCanvas').getContext('2d');
  if (chart) {
    chart.destroy();
  }
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Temp1',
          data: temp1Data,
          borderColor: 'red',
          backgroundColor: 'red',
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Temp3',
          data: temp3Data,
          borderColor: 'blue',
          backgroundColor: 'blue',
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Current (A)',
          data: currentData,
          borderColor: 'green',
          backgroundColor: 'green',
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Chamber Temperature',
          data: chamberTempData,
          borderColor: 'orange',
          backgroundColor: 'orange',
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time [m]',
          },
          grid: {
            display: true
          }
        },
        y: {
          title: {
            display: true,
            text: 'Temperature',
          },
          grid: {
            display: true
          }
        },
      },
      plugins: {
        legend: {
          labels: {
            color: 'black'
          }
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x',
            onPanComplete({ chart }) {
              console.log('Pan complete', chart);
            }
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            mode: 'x',
            onZoomComplete({ chart }) {
              console.log('Zoom complete', chart);
            }
          }
        }
      }
    }
  });

  document.getElementById('saveButton').disabled = false;
  document.getElementById('exportButton').disabled = false;
}

function toggleDataSection() {
  const dataSection = document.getElementById('dataSection');
  const toggleButton = document.getElementById('toggleButton');
  const viewButton = document.getElementById('viewButton');
  const leftSection = document.querySelector('.left');

  if (dataSection.classList.contains('hidden')) {
    dataSection.classList.remove('hidden');
    leftSection.classList.remove('expanded');
    toggleButton.textContent = 'Hide Data';
    viewButton.classList.add('hidden');
  } else {
    dataSection.classList.add('hidden');
    leftSection.classList.add('expanded');
    toggleButton.textContent = 'View Data';
    viewButton.classList.remove('hidden');
  }

  // Adjust the chart size
  if (chart) {
    chart.resize();
  }
}

function saveGraph() {
  const canvas = document.getElementById('chartCanvas');
  const ctx = canvas.getContext('2d');

  // Set white background before saving
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imageData = canvas.toDataURL('image/jpeg', 1.0);
  console.log('Saving graph...');  // Debugging statement
  window.electron.saveGraph(imageData).then(filePath => {
    if (filePath) {
      alert(`Graph saved to ${filePath}`);
    } else {
      console.error('Save was canceled or failed.');
    }
  }).catch(error => {
    console.error('Error invoking saveGraph:', error);
  });
}

function exportToExcel() {
  const tableBody = document.getElementById('dataTable').querySelector('tbody');
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  const data = rows.map(row => {
    const cells = row.querySelectorAll('td');
    return {
      time: cells[0].textContent,
      temp1: cells[1].textContent,
      temp3: cells[2].textContent,
      chamberTemp: cells[3].textContent
    };
  });

  window.electron.exportExcel(data).then(filePath => {
    if (filePath) {
      alert(`Data exported to ${filePath}`);
    } else {
      console.error('Export was canceled or failed.');
    }
  }).catch(error => {
    console.error('Error invoking exportExcel:', error);
  });
}


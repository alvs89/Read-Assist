export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  // Create a temporary object URL so exports work entirely in the browser.
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadBlobFile(filename: string, blob: Blob) {
  // Revoke the URL after the browser has time to start the download.
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export function downloadJsonFile(filename: string, data: unknown) {
  downloadTextFile(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
}

const escapeCsvValue = (value: unknown) => {
  if (value === null || value === undefined) return '';

  // Quote CSV cells that contain commas, quotes, or line breaks so spreadsheets import them safely.
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export function downloadCsvFile(filename: string, headers: string[], rows: Array<Record<string, unknown>>) {
  const csvLines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map(row => headers.map(header => escapeCsvValue(row[header])).join(',')),
  ];

  downloadTextFile(filename, csvLines.join('\n'), 'text/csv;charset=utf-8');
}

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Path to your XLS file
const xlsFilePath = path.join(__dirname, '../../data.xls');

// Function to read XLS file
const readXlsFile = () => {
  if (fs.existsSync(xlsFilePath)) {
    const workbook = xlsx.readFile(xlsFilePath);
    const sheet_name_list = workbook.SheetNames;
    const worksheet = workbook.Sheets[sheet_name_list[0]];
    return xlsx.utils.sheet_to_json(worksheet);
  }
  return [];
};

// Function to write to XLS file
const writeXlsFile = (data) => {
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
  xlsx.writeFile(wb, xlsFilePath);
};

// Export handler function
exports.handler = async (event, context) => {
  const { httpMethod, body, queryStringParameters } = event;

  if (httpMethod === 'GET' && queryStringParameters?.action === 'get-data') {
    const data = readXlsFile();
    return {
      statusCode: 200,
      body: JSON.stringify({ data }),
    };
  }

  if (httpMethod === 'POST' && queryStringParameters?.action === 'save-data') {
    const { data } = JSON.parse(body);
    if (Array.isArray(data)) {
      writeXlsFile(data);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Data saved successfully' }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Data should be an array' }),
      };
    }
  }

  if (httpMethod === 'POST' && queryStringParameters?.action === 'update-data') {
    const { rowIndex, newData } = JSON.parse(body);
    let data = readXlsFile();
    if (rowIndex < data.length) {
      data[rowIndex] = { ...data[rowIndex], ...newData };
      writeXlsFile(data);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Data updated successfully' }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Row index out of bounds' }),
      };
    }
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Not Found' }),
  };
};

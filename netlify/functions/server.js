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

// Function to delete a specific row from the XLS file
const deleteRow = (index) => {
  const data = readXlsFile();
  if (index >= 0 && index < data.length) {
    data.splice(index, 1);  // Remove the row at the specified index
    writeXlsFile(data);
    return { success: true, message: 'Row deleted successfully' };
  } else {
    return { success: false, message: 'Row index out of bounds' };
  }
};

// Function to clear all data in the XLS file
const deleteAllData = () => {
  writeXlsFile([]);  // Writing an empty array clears the sheet
};

// Export handler function
exports.handler = async (event, context) => {
  const { httpMethod, body, queryStringParameters } = event;

  // Add CORS headers to allow cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*',  // Allow all origins (you can restrict this to a specific domain for security)
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',  // Allow specific methods
    'Access-Control-Allow-Headers': 'Content-Type',  // Allow specific headers
  };

  // Preflight request handling (OPTIONS method)
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,  // No content, successful preflight
      headers: headers,
    };
  }

  // Check if body exists before parsing it
  let parsedBody = {};
  try {
    if (body) {
      parsedBody = JSON.parse(body);
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON format' }),
      headers: headers,
    };
  }

  // Get data
  if (httpMethod === 'GET' && queryStringParameters?.action === 'get-data') {
    const data = readXlsFile();
    return {
      statusCode: 200,
      body: JSON.stringify({ data }),
      headers: headers,  // Include CORS headers in the response
    };
  }

  // Save data
  if (httpMethod === 'POST' && queryStringParameters?.action === 'save-data') {
    const { data } = parsedBody;
    if (Array.isArray(data)) {
      writeXlsFile(data);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Data saved successfully' }),
        headers: headers,  // Include CORS headers in the response
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Data should be an array' }),
        headers: headers,  // Include CORS headers in the response
      };
    }
  }

  // Update data
  if (httpMethod === 'POST' && queryStringParameters?.action === 'update-data') {
    const { rowIndex, newData } = parsedBody;
    let data = readXlsFile();
    if (rowIndex < data.length) {
      data[rowIndex] = { ...data[rowIndex], ...newData };
      writeXlsFile(data);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Data updated successfully' }),
        headers: headers,  // Include CORS headers in the response
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Row index out of bounds' }),
        headers: headers,  // Include CORS headers in the response
      };
    }
  }

  // Delete specific row by index
  if (httpMethod === 'POST' && queryStringParameters?.action === 'delete-row') {
    const { rowIndex } = parsedBody;
    const result = deleteRow(rowIndex);
    if (result.success) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: result.message }),
        headers: headers,  // Include CORS headers in the response
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: result.message }),
        headers: headers,  // Include CORS headers in the response
      };
    }
  }

  // Delete all data in the XLS file
  if (httpMethod === 'POST' && queryStringParameters?.action === 'delete-all-data') {
    deleteAllData();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'All data deleted successfully' }),
      headers: headers,  // Include CORS headers in the response
    };
  }

  // Return 404 if action is not recognized
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Not Found' }),
    headers: headers,  // Include CORS headers in the response
  };
};

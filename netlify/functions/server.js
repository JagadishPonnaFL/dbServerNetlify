const fs = require('fs');
const path = require('path');

// Path to your local JSON file
const jsonFilePath = path.join(__dirname, 'data.json');

// Function to read data from the JSON file
const readDataFile = () => {
  if (fs.existsSync(jsonFilePath)) {
    const rawData = fs.readFileSync(jsonFilePath, 'utf8');
    return JSON.parse(rawData);
  }
  return [];
};

// Function to write data to the JSON file
const writeDataFile = (data) => {
  const jsonData = JSON.stringify(data, null, 2);  // Pretty print JSON
  fs.writeFileSync(jsonFilePath, jsonData, 'utf8');
};

// Function to handle CORS headers for every response
const handleCORS = (headers = {}) => {
  return {
    ...headers,
    'Access-Control-Allow-Origin': '*',  // Allow all origins (for development)
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Allowed HTTP methods
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Allowed headers
  };
};

// Function to handle different HTTP requests
exports.handler = async (event, context) => {
  const { httpMethod, body, queryStringParameters } = event;

  // Handle CORS Pre-flight OPTIONS request
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: handleCORS(),
      body: '',
    };
  }

  // Handle GET request for fetching data
  if (httpMethod === 'GET' && queryStringParameters?.action === 'get-data') {
    try {
      const data = readDataFile();
      return {
        statusCode: 200,
        headers: handleCORS(),
        body: JSON.stringify({ data }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers: handleCORS(),
        body: JSON.stringify({ error: 'Failed to retrieve data' }),
      };
    }
  }

  // Handle POST request to save data
  if (httpMethod === 'POST' && queryStringParameters?.action === 'save-data') {
    try {
      // Parse the body as JSON
      const { data } = JSON.parse(body);

      // Validate if data is an array
      if (Array.isArray(data)) {
        writeDataFile(data);
        return {
          statusCode: 200,
          headers: handleCORS(),
          body: JSON.stringify({ message: 'Data saved successfully' }),
        };
      } else {
        return {
          statusCode: 400,
          headers: handleCORS(),
          body: JSON.stringify({ error: 'Data should be an array' }),
        };
      }
    } catch (error) {
      return {
        statusCode: 400,
        headers: handleCORS(),
        body: JSON.stringify({ error: 'Invalid JSON format' }),
      };
    }
  }

  // Handle POST request to update data
  if (httpMethod === 'POST' && queryStringParameters?.action === 'update-data') {
    try {
      const { rowIndex, newData } = JSON.parse(body);
      let data = readDataFile();

      // Check if rowIndex is valid
      if (rowIndex < data.length) {
        data[rowIndex] = { ...data[rowIndex], ...newData };
        writeDataFile(data);
        return {
          statusCode: 200,
          headers: handleCORS(),
          body: JSON.stringify({ message: 'Data updated successfully' }),
        };
      } else {
        return {
          statusCode: 400,
          headers: handleCORS(),
          body: JSON.stringify({ error: 'Row index out of bounds' }),
        };
      }
    } catch (error) {
      return {
        statusCode: 400,
        headers: handleCORS(),
        body: JSON.stringify({ error: 'Invalid JSON format' }),
      };
    }
  }

  // Handle POST request to delete data
  if (httpMethod === 'POST' && queryStringParameters?.action === 'delete-data') {
    try {
      const { rowIndex } = JSON.parse(body);
      let data = readDataFile();

      // Check if rowIndex is valid
      if (rowIndex < data.length) {
        data.splice(rowIndex, 1);  // Remove the item at the specified index
        writeDataFile(data);
        return {
          statusCode: 200,
          headers: handleCORS(),
          body: JSON.stringify({ message: 'Data deleted successfully' }),
        };
      } else {
        return {
          statusCode: 400,
          headers: handleCORS(),
          body: JSON.stringify({ error: 'Row index out of bounds' }),
        };
      }
    } catch (error) {
      return {
        statusCode: 400,
        headers: handleCORS(),
        body: JSON.stringify({ error: 'Invalid JSON format' }),
      };
    }
  }

  return {
    statusCode: 404,
    headers: handleCORS(),
    body: JSON.stringify({ error: 'Not Found' }),
  };
};

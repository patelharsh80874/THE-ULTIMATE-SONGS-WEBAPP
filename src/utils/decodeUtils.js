let memoizedTextarea = null;

export const decodeString = (str) => {
  if (!str || typeof str !== 'string' || !str.includes('&')) return str;

  if (!memoizedTextarea && typeof document !== 'undefined') {
    memoizedTextarea = document.createElement("textarea");
  }

  if (memoizedTextarea) {
    memoizedTextarea.innerHTML = str;
    return memoizedTextarea.value;
  }
  
  return str;
};

/**
 * Recursively decodes HTML entities in an object or array.
 * @param {any} data The data to decode.
 * @returns {any} The decoded data.
 */
export const decodeData = (data) => {
  if (!data) return data;

  if (typeof data === 'string') {
    return decodeString(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => decodeData(item));
  }

  if (typeof data === 'object') {
    const newData = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Skip binary data or large objects if needed
        // For now we decode everything for simplicity as per user request
        newData[key] = decodeData(data[key]);
      }
    }
    return newData;
  }

  return data;
};

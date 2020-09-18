const axios = require('axios');

const ACCOUNT_NAME = 'hiringcoders8';
const ENVIRONMENT = 'vtexcommercestable';
const HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    "X-VTEX-API-AppKey": "vtexappkey-hiringcoders8-QQLYJQ",
    "X-VTEX-API-AppToken": "PHTDSYHQRAHFDPPXAQRKNXIRBZKBMYSZNTGMZWXXHTHMGALEIWGVUJHRYBBSOGDSIISKICXDSUCUQVKBOGTQSXFDLOOYVEJBPOEYIBVFYCCAGNACRZEHMNAKDOYTOZIO"
}

async function getNameByEmail(email) {
    const baseUrl = `https://${ACCOUNT_NAME}.${ENVIRONMENT}.com.br`;
    const queryUrl =  `${baseUrl}/api/dataentities/CL/search?_fields=firstName&_where=email%20%3D%20${email}&_keyword=String%20to%20search&_sort=firstName%20AS`
    
    const options = {
        headers: HEADERS,
    }

    const result = await axios.get(queryUrl, options);
    
    return result.data;
} 

module.exports = getNameByEmail;
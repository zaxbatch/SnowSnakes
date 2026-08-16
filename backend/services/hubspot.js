const fetch = require('node-fetch');

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
const HUBSPOT_API_URL = 'https://api.hubapi.com/crm/v3/objects/contacts';

/**
 * Create a contact in HubSpot (lead)
 * @param {Object} userData - { email, firstname, lastname? }
 */
async function createHubSpotContact(userData) {
  if (!HUBSPOT_API_KEY) {
    console.warn('⚠️ HubSpot API key not set – skipping lead creation');
    return null;
  }

  const body = {
    properties: {
      email: userData.email,
      firstname: userData.firstname || userData.username,
      lastname: userData.lastname || '',
      // You can add more fields: phone, company, etc.
    }
  };

  try {
    const response = await fetch(HUBSPOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HubSpot error:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ HubSpot lead created:', data.id);
    return data;
  } catch (err) {
    console.error('HubSpot request failed:', err.message);
    return null;
  }
}

module.exports = { createHubSpotContact };
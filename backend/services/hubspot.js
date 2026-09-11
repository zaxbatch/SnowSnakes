const fetch = require('node-fetch');

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_API_URL = 'https://api.hubapi.com/crm/v3/objects/contacts';

// Presence only. This previously printed the first 8 characters of the
// access token on every boot, which put a chunk of a live credential into
// the host's log output — logs are widely readable and long-lived, so a
// token fragment does not belong there.
if (!HUBSPOT_ACCESS_TOKEN) {
  console.warn('⚠️ HUBSPOT_ACCESS_TOKEN not set – lead creation disabled');
}

async function createHubSpotContact(userData) {
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.warn('⚠️ HubSpot access token not set – skipping lead creation');
    return null;
  }

  const body = {
    properties: {
      email: userData.email,
      firstname: userData.firstname || userData.username,
      lastname: userData.lastname || '',
    }
  };

  try {
    const response = await fetch(HUBSPOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`  // ✅ Use Bearer token
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HubSpot error:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ HubSpot lead created:', data.id);
    return data;
  } catch (err) {
    console.error('❌ HubSpot request failed:', err.message);
    return null;
  }
}

module.exports = { createHubSpotContact };
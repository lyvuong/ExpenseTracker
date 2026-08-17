import fs from 'fs';

const projectId = 'pwa-experiment-291c0';
const householdCode = '3701';

async function getAccessToken() {
  const toolsConfig = JSON.parse(fs.readFileSync('C:/Users/lyvuo/.config/configstore/firebase-tools.json', 'utf8'));
  const tokens = toolsConfig.tokens;

  if (Date.now() >= (tokens.expires_at || 0) - 60000) {
    console.log('Refreshing OAuth access token...');
    const params = new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await res.json();
    if (data.access_token) {
      tokens.access_token = data.access_token;
      tokens.expires_at = Date.now() + (data.expires_in * 1000);
      toolsConfig.tokens = tokens;
      fs.writeFileSync('C:/Users/lyvuo/.config/configstore/firebase-tools.json', JSON.stringify(toolsConfig, null, 2));
      console.log('Access token refreshed successfully.');
    }
  }

  return tokens.access_token;
}

function valueToFirestore(val) {
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return { doubleValue: val };
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(valueToFirestore) } };
  if (typeof val === 'object' && val !== null) {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = valueToFirestore(v);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: 'NULL_VALUE' };
}

async function runCleanup() {
  const token = await getAccessToken();

  // 1. Clean households/3701/metadata/info
  const metaUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/households/${householdCode}/metadata/info`;
  const resMeta = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
  const currentMeta = await resMeta.json();

  console.log('Current metadata before cleanup:', JSON.stringify(currentMeta, null, 2));

  const cleanMembers = [
    {
      uid: '4IYClk8E3Tdt4QBQsfw4FZHPkpb2',
      displayName: 'Ly Vuong',
      email: 'lyvuong@gmail.com'
    },
    {
      uid: '3fTKNuTARzZPzR0IQHrJI9SJCjy2',
      displayName: 'Huong Pham',
      email: 'hnpham3149@gmail.com'
    },
    {
      uid: 'cvlHl3YCo6fxn7CjAMzovWWXfJq1',
      displayName: 'Quoc-Huan Vuong',
      email: 'vqhuan@lv5.org'
    }
  ];

  const cleanMemberUids = {
    '4IYClk8E3Tdt4QBQsfw4FZHPkpb2': true,
    '3fTKNuTARzZPzR0IQHrJI9SJCjy2': true,
    'cvlHl3YCo6fxn7CjAMzovWWXfJq1': true
  };

  const patchBody = {
    fields: {
      ...currentMeta.fields,
      members: valueToFirestore(cleanMembers),
      memberUids: valueToFirestore(cleanMemberUids),
      userMigrationInfo: valueToFirestore({
        action: 'cleanup_duplicate_placeholder_members',
        previousMembersCount: 5,
        cleanedMembersCount: 3,
        cleanedAt: new Date().toISOString()
      })
    }
  };

  const patchRes = await fetch(metaUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(patchBody)
  });

  const updatedMeta = await patchRes.json();
  console.log('Updated metadata status:', patchRes.status);
  console.log('Updated metadata:', JSON.stringify(updatedMeta, null, 2));

  // 2. Update weight_members linkedUid if necessary
  const weightHuanUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/households/${householdCode}/weight_members/person-uid-user-huan?updateMask.fieldPaths=linkedUid`;
  const patchHuanRes = await fetch(weightHuanUrl, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: { linkedUid: { stringValue: 'cvlHl3YCo6fxn7CjAMzovWWXfJq1' } }
    })
  });
  console.log('Weight member Huan linkedUid update:', patchHuanRes.status);

  const weightHuongUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/households/${householdCode}/weight_members/person-uid-user-huong?updateMask.fieldPaths=linkedUid`;
  const patchHuongRes = await fetch(weightHuongUrl, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: { linkedUid: { stringValue: '3fTKNuTARzZPzR0IQHrJI9SJCjy2' } }
    })
  });
  console.log('Weight member Huong linkedUid update:', patchHuongRes.status);

  console.log('🎉 Cleanup completed successfully!');
}

runCleanup().catch(console.error);

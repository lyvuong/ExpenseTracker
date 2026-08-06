import fs from 'fs';

const projectId = 'pwa-experiment-291c0';
const targetHousehold = process.argv[2] || '3701';
const batchTag = process.argv[3] || 'debits-csv-2026-08-06';

async function getAccessToken() {
  const toolsConfig = JSON.parse(fs.readFileSync('C:/Users/lyvuo/.config/configstore/firebase-tools.json', 'utf8'));
  const tokens = toolsConfig.tokens;

  if (Date.now() >= (tokens.expires_at || 0) - 60000) {
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
    }
  }

  return tokens.access_token;
}

async function rollback() {
  console.log(`===================================================`);
  console.log(`ROLLBACK UTILITY - Project: ${projectId}`);
  console.log(`Target Household: ${targetHousehold}`);
  console.log(`Migration Batch Tag: ${batchTag}`);
  console.log(`===================================================\n`);

  const token = await getAccessToken();

  // Query documents matching migrationBatch
  const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  const queryBody = {
    structuredQuery: {
      from: [{ collectionId: 'transactions' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'migrationBatch' },
          op: 'EQUAL',
          value: { stringValue: batchTag }
        }
      }
    }
  };

  const res = await fetch(queryUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(queryBody)
  });

  const results = await res.json();
  const docNames = results.map(r => r.document?.name).filter(Boolean);

  console.log(`Found ${docNames.length} migrated documents matching batch "${batchTag}".`);

  if (docNames.length === 0) {
    console.log('No migrated documents found to delete.');
    process.exit(0);
  }

  // Batch delete using commit endpoint
  let writes = docNames.map(name => ({ delete: name }));
  const commitUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;

  const commitRes = await fetch(commitUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes })
  });

  if (!commitRes.ok) {
    const errText = await commitRes.text();
    throw new Error(`Rollback failed: ${errText}`);
  }

  console.log(`\n✅ ROLLBACK SUCCESS: Successfully deleted all ${docNames.length} migrated documents from households/${targetHousehold}/transactions.`);
  process.exit(0);
}

rollback().catch(err => {
  console.error('Rollback error:', err);
  process.exit(1);
});

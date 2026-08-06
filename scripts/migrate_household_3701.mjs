import fs from 'fs';
import { buildMigrationPayload } from './migrate_test_family.mjs';

const projectId = 'pwa-experiment-291c0';
const householdCode = '3701';
const migrationBatch = 'debits-csv-2026-08-06';
const migratedAt = new Date().toISOString();

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

async function commitBatch(token, writes) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ writes })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore batch commit failed (${res.status} ${res.statusText}): ${errText}`);
  }
  return res.json();
}

async function runFullMigration() {
  console.log(`===================================================`);
  console.log(`LIVE MIGRATION TO HOUSEHOLD ${householdCode}`);
  console.log(`Project: ${projectId}`);
  console.log(`Batch Tag: ${migrationBatch}`);
  console.log(`===================================================\n`);

  const token = await getAccessToken();
  console.log('Authenticated with OAuth Access Token.');

  // 1. Ensure Household Metadata
  console.log(`Setting household ${householdCode} metadata...`);
  const metaUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/households/${householdCode}/metadata/info`;
  const metaBody = {
    fields: {
      code: { stringValue: householdCode },
      createdAt: { stringValue: migratedAt },
      createdBy: { mapValue: { fields: { displayName: { stringValue: 'Ly Vuong' }, uid: { stringValue: 'admin-migrated' } } } },
      members: {
        arrayValue: {
          values: [
            { mapValue: { fields: { displayName: { stringValue: 'Anh Vuong' }, uid: { stringValue: 'user-ly' } } } },
            { mapValue: { fields: { displayName: { stringValue: 'Huong Pham' }, uid: { stringValue: 'user-huong' } } } },
            { mapValue: { fields: { displayName: { stringValue: 'Huan Vuong' }, uid: { stringValue: 'user-huan' } } } }
          ]
        }
      }
    }
  };
  await fetch(metaUrl, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(metaBody)
  });
  console.log('✅ Household metadata updated.');

  // 2. Build Payload
  const payload = buildMigrationPayload(householdCode, 0); // 0 = all 1817 records
  console.log(`Loaded ${payload.transactions.length} transactions and ${payload.paymentTypes.length} payment types.`);

  // 3. Write Payment Types
  console.log(`Writing payment types to households/${householdCode}/payment_types...`);
  const ptWrites = payload.paymentTypes.map(pt => ({
    update: {
      name: `projects/${projectId}/databases/(default)/documents/households/${householdCode}/payment_types/${pt.id}`,
      fields: {
        id: { stringValue: pt.id },
        name: { stringValue: pt.name },
        ownerName: { stringValue: pt.ownerName || 'Anh Vuong' },
        isSystemDefault: { booleanValue: !!pt.isSystemDefault },
        isMigrated: { booleanValue: true },
        migrationBatch: { stringValue: migrationBatch },
        migratedAt: { stringValue: migratedAt }
      }
    }
  }));
  await commitBatch(token, ptWrites);
  console.log(`✅ Payment types written (${ptWrites.length} items).`);

  // 4. Write Transactions in 400-doc Batches
  console.log(`Writing ${payload.transactions.length} transactions in batches...`);
  let batchWrites = [];
  let totalCommitted = 0;

  for (let i = 0; i < payload.transactions.length; i++) {
    const tx = payload.transactions[i];
    batchWrites.push({
      update: {
        name: `projects/${projectId}/databases/(default)/documents/households/${householdCode}/transactions/${tx.id}`,
        fields: {
          id: { stringValue: tx.id },
          date: { stringValue: tx.date },
          time: { stringValue: tx.time },
          amount: { doubleValue: tx.amount },
          vendor: { stringValue: tx.vendor },
          notes: { stringValue: tx.notes || '' },
          category: { stringValue: tx.category },
          paymentType: { stringValue: tx.paymentType },
          user: { stringValue: tx.user },
          isMigrated: { booleanValue: true },
          migrationBatch: { stringValue: migrationBatch },
          migratedAt: { stringValue: migratedAt }
        }
      }
    });

    if (batchWrites.length === 400 || i === payload.transactions.length - 1) {
      await commitBatch(token, batchWrites);
      totalCommitted += batchWrites.length;
      console.log(`Committed batch: ${totalCommitted} / ${payload.transactions.length} transactions...`);
      batchWrites = [];
    }
  }

  console.log(`\n🎉 MIGRATION COMPLETE: Successfully written all ${totalCommitted} transactions & ${ptWrites.length} payment methods to household ${householdCode} on project ${projectId}!`);
  process.exit(0);
}

runFullMigration().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});

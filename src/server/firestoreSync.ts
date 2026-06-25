import { Firestore } from '@google-cloud/firestore';
import fs from 'fs';
import path from 'path';
import { DatabaseSchema } from './db';

const DB_PATH = path.join(process.cwd(), 'data-db.json');

// Load firebase config if available
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firestoreConfig: any = {};
if (fs.existsSync(configPath)) {
  try {
    firestoreConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (err) {
    console.error('[Firestore Sync] Error reading firebase-applet-config.json', err);
  }
}

// Instantiate Firestore with correct project and database context
const firestore = new Firestore({
  projectId: firestoreConfig.projectId,
  databaseId: firestoreConfig.firestoreDatabaseId || '(default)',
});

// A local in-memory snapshot of the database to perform efficient diffs
let lastSyncedDb: DatabaseSchema | null = null;

// Track if Cloud Firestore is active and authorized
let isCloudDbAvailable = true;

/**
 * Array of all list collections to sync.
 * Mapping of database property name to Firestore collection name and its unique identifier field.
 */
const collectionsToSync: Array<{
  prop: keyof DatabaseSchema;
  collection: string;
  keyField: string;
}> = [
  { prop: 'users', collection: 'users', keyField: 'id' },
  { prop: 'balances', collection: 'balances', keyField: 'user_id' },
  { prop: 'resources', collection: 'resources', keyField: 'id' },
  { prop: 'campaigns', collection: 'campaigns', keyField: 'id' },
  { prop: 'campaign_escrows', collection: 'campaign_escrows', keyField: 'campaign_id' },
  { prop: 'task_completions', collection: 'task_completions', keyField: 'id' },
  { prop: 'referrals', collection: 'referrals', keyField: 'id' },
  { prop: 'ledger_transactions', collection: 'ledger_transactions', keyField: 'id' },
  { prop: 'claims', collection: 'claims', keyField: 'id' },
  { prop: 'fraud_flags', collection: 'fraud_flags', keyField: 'id' },
  { prop: 'auth_providers', collection: 'auth_providers', keyField: 'id' },
  { prop: 'referral_audit_logs', collection: 'referral_audit_logs', keyField: 'id' },
];

/**
 * Downloads the database state from Firestore on server startup.
 * If Firestore collections are empty, seeds Firestore using the initial database.
 */
export async function initializeDbFromFirestore(): Promise<void> {
  console.log('[Firestore Sync] Initializing local database from Firestore cloud storage...');
  try {
    const freshDb: Partial<DatabaseSchema> = {};
    let hasCloudData = false;

    // Load each collection from Firestore
    for (const item of collectionsToSync) {
      console.log(`[Firestore Sync] Fetching collection: "${item.collection}"...`);
      const snapshot = await firestore.collection(item.collection).get();
      
      const list: any[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data());
      });

      if (list.length > 0) {
        hasCloudData = true;
      }
      (freshDb as any)[item.prop] = list;
    }

    // Load system configurations from the 'system_config' collection
    console.log('[Firestore Sync] Fetching system_config collection...');
    const sysConfigRef = firestore.collection('system_config');
    const configDoc = await sysConfigRef.doc('config').get();
    const feeWalletDoc = await sysConfigRef.doc('fee_wallet').get();

    if (configDoc.exists) {
      freshDb.config = configDoc.data() as any;
      hasCloudData = true;
    }
    if (feeWalletDoc.exists) {
      freshDb.fee_wallet = feeWalletDoc.data() as any;
      hasCloudData = true;
    }

    if (hasCloudData) {
      console.log('[Firestore Sync] Successfully retrieved persistent database state from Firestore!');
      
      // Ensure missing lists default to empty arrays
      for (const item of collectionsToSync) {
        if (!freshDb[item.prop]) {
          (freshDb as any)[item.prop] = [];
        }
      }

      // Read local JSON file to preserve local-only or fallback items if necessary, but prioritize cloud
      let localDb: DatabaseSchema | null = null;
      if (fs.existsSync(DB_PATH)) {
        try {
          localDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        } catch (e) {}
      }

      const mergedDb: DatabaseSchema = {
        users: freshDb.users || [],
        balances: freshDb.balances || [],
        resources: freshDb.resources || [],
        campaigns: freshDb.campaigns || [],
        campaign_escrows: freshDb.campaign_escrows || [],
        task_completions: freshDb.task_completions || [],
        referrals: freshDb.referrals || [],
        ledger_transactions: freshDb.ledger_transactions || [],
        fee_wallet: freshDb.fee_wallet || localDb?.fee_wallet || {
          id: 'VIRAL_Fee_wallet',
          wallet_name: 'VIRAL_Fee_wallet',
          total_collected: 0,
          currency: 'vVIRAL',
          updated_at: new Date().toISOString()
        },
        claims: freshDb.claims || [],
        fraud_flags: freshDb.fraud_flags || [],
        config: freshDb.config || localDb?.config || {
          starterBonus: 100,
          platformFeePercent: 10,
          dailyRewardLimit: 1000,
          weeklyRewardLimit: 5000,
          monthlyRewardLimit: 20000,
          claimPoolSize: 200000000,
          isBonded: false
        },
        auth_providers: freshDb.auth_providers || [],
        referral_audit_logs: freshDb.referral_audit_logs || [],
      };

      // Save locally to data-db.json for fast synchronous read availability
      fs.writeFileSync(DB_PATH, JSON.stringify(mergedDb, null, 2), 'utf-8');
      lastSyncedDb = JSON.parse(JSON.stringify(mergedDb)); // clone snapshot
    } else {
      console.log('[Firestore Sync] Firestore database is currently empty. Seeding Firestore using local database...');
      // Read local database
      if (fs.existsSync(DB_PATH)) {
        try {
          const localDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as DatabaseSchema;
          await seedFirestore(localDb);
          lastSyncedDb = JSON.parse(JSON.stringify(localDb));
        } catch (err) {
          console.error('[Firestore Sync] Error parsing local DB to seed Firestore:', err);
        }
      } else {
        console.warn('[Firestore Sync] No local data-db.json found to seed. Relying on defaults.');
      }
    }
  } catch (err) {
    if (err instanceof Error && (err.message.includes('PERMISSION_DENIED') || err.message.includes('permission-denied') || err.message.includes('Missing or insufficient permissions'))) {
      isCloudDbAvailable = false;
      console.warn('[Firestore Sync] WARNING: Cloud Firestore database is currently unavailable due to insufficient permissions. Self-healing fallback activated: utilizing local database filesystem as the primary persistence layer.');
    } else {
      console.error('[Firestore Sync] WARNING: Failed to initialize database from Firestore. Falling back to local data-db.json.', err);
    }
    // On failure, load from local file to ensure app uptime
    if (fs.existsSync(DB_PATH)) {
      try {
        lastSyncedDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      } catch (e) {}
    }
  }
}

/**
 * Seed all tables and configuration parameters directly into Firestore.
 */
async function seedFirestore(db: DatabaseSchema): Promise<void> {
  try {
    const batch = firestore.batch();

    for (const item of collectionsToSync) {
      const list = (db as any)[item.prop] || [];
      console.log(`[Firestore Sync Seeding] Queueing ${list.length} documents for "${item.collection}"...`);
      for (const entity of list) {
        const id = entity[item.keyField];
        if (id) {
          const docRef = firestore.collection(item.collection).doc(String(id));
          batch.set(docRef, entity);
        }
      }
    }

    // Seed system config docs
    if (db.config) {
      batch.set(firestore.collection('system_config').doc('config'), db.config);
    }
    if (db.fee_wallet) {
      batch.set(firestore.collection('system_config').doc('fee_wallet'), db.fee_wallet);
    }

    console.log('[Firestore Sync Seeding] Committing batch write to Firestore...');
    await batch.commit();
    console.log('[Firestore Sync Seeding] Successfully seeded all data into cloud Firestore!');
  } catch (err) {
    console.error('[Firestore Sync Seeding] Error seeding Firestore:', err);
  }
}

/**
 * Asynchronously synchronizes any changes between local memory/file states and cloud Firestore.
 * Performs a highly performant diffing sync to only write modified elements.
 */
export function syncDatabaseToFirestore(newDb: DatabaseSchema): void {
  // If cloud database is unavailable, skip synchronization and persist locally
  if (!isCloudDbAvailable) {
    return;
  }

  // Execute asynchronously in background to ensure 0ms latency impact to the user
  Promise.resolve().then(async () => {
    try {
      if (!lastSyncedDb) {
        // If snapshot is missing, initialize snapshot and sync everything
        lastSyncedDb = JSON.parse(JSON.stringify(newDb));
        await seedFirestore(newDb);
        return;
      }

      const batch = firestore.batch();
      let pendingOpsCount = 0;

      // Check each list collection for added or updated items
      for (const item of collectionsToSync) {
        const newList = (newDb as any)[item.prop] || [];
        const oldList = (lastSyncedDb as any)[item.prop] || [];

        // Create mapping of old list for O(1) comparison
        const oldMap = new Map<string, any>();
        for (const oldItem of oldList) {
          const id = oldItem[item.keyField];
          if (id) oldMap.set(String(id), oldItem);
        }

        for (const newItem of newList) {
          const id = newItem[item.keyField];
          if (!id) continue;

          const oldVal = oldMap.get(String(id));
          // If item is new or modified, queue update
          if (!oldVal || JSON.stringify(newItem) !== JSON.stringify(oldVal)) {
            const docRef = firestore.collection(item.collection).doc(String(id));
            batch.set(docRef, newItem);
            pendingOpsCount++;
          }
        }
      }

      // Check system configurations
      if (JSON.stringify(newDb.config) !== JSON.stringify(lastSyncedDb.config)) {
        batch.set(firestore.collection('system_config').doc('config'), newDb.config);
        pendingOpsCount++;
      }
      if (JSON.stringify(newDb.fee_wallet) !== JSON.stringify(lastSyncedDb.fee_wallet)) {
        batch.set(firestore.collection('system_config').doc('fee_wallet'), newDb.fee_wallet);
        pendingOpsCount++;
      }

      // Commit changes if any modifications were found
      if (pendingOpsCount > 0) {
        console.log(`[Firestore Sync] Synchronizing ${pendingOpsCount} modified records to cloud database...`);
        await batch.commit();
        console.log('[Firestore Sync] Cloud database synchronization completed successfully.');
      }

      // Update local memory snapshot for next sync run
      lastSyncedDb = JSON.parse(JSON.stringify(newDb));
    } catch (err) {
      if (err instanceof Error && (err.message.includes('PERMISSION_DENIED') || err.message.includes('permission-denied') || err.message.includes('Missing or insufficient permissions'))) {
        isCloudDbAvailable = false;
        console.warn('[Firestore Sync] WARNING: Cloud Firestore permissions revoked or missing during write. Self-healing fallback activated: defaulting to local database storage.');
      } else {
        console.error('[Firestore Sync] Failed to synchronize updates to Firestore:', err);
      }
    }
  });
}

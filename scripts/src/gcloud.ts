import { execSync } from 'child_process';

if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error('FIREBASE_PROJECT_ID is not set');
}

const args = process.argv.slice(2);
const command = `gcloud --project ${process.env.FIREBASE_PROJECT_ID} ` + args.join(' ');
console.log(`Running: ${command}`);
execSync(command, { stdio: 'inherit' });

import { program } from 'commander';
import yesno from 'yesno';
import { createAdminUser } from './models/user';
import { runWithFirebaseApp } from './utils/firebase';

type Props = {
  email: string;
  password?: string;
};

runWithFirebaseApp(async () => {
  const { email, password } = program
    .requiredOption('-e, --email <email>')
    .option('-p, --password <password>')
    .parse(process.argv)
    .opts() as Props;

  if (!email) {
    console.error(program.outputHelp());
    return;
  }

  console.info('');
  console.info('[email]', email);
  if (password) console.info('[password]', '******');
  console.info('');
  const ok = await yesno({
    question: 'Create admin account? (y/n)',
  });
  if (!ok) {
    console.info('Cancelled');
    return;
  }

  await createAdminUser({ email, password });
  console.info('Admin account created');
});

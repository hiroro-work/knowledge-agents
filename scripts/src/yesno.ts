import { program } from 'commander';
import yesno from 'yesno';

type Props = {
  message: string;
};

const run = async () => {
  const { message } = program.option('-m, --message <message>').parse(process.argv).opts() as Props;

  if (!message) {
    console.error(program.outputHelp());
    return;
  }

  const ok = await yesno({
    question: `${message} (y/n)`,
  });
  process.exit(ok ? 0 : 1);
};

run();

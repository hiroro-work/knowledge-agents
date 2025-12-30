import { execSync } from 'child_process';
import { Command } from 'commander';

const program = new Command();

program
  .option('--only <services>', 'Firebase Emulator services to run', 'auth,firestore,functions')
  .option('--project <alias>', 'Firebase project alias', 'test')
  .requiredOption('--script <command>', 'Script command to run inside emulator')
  .allowUnknownOption()
  .allowExcessArguments()
  .parse(process.argv);

const options = program.opts();
const remainingArgs = program.args;

const baseCommand = options.script;
const additionalArgs = remainingArgs
  .map((arg: string) => {
    if (arg.endsWith('.ts') || arg.endsWith('.js')) {
      const globPattern = arg.replace(/\$/g, '*');
      return `"${globPattern}"`;
    }
    return arg;
  })
  .join(' ');

const fullCommand = additionalArgs ? `${baseCommand} ${additionalArgs}` : baseCommand;

const firebaseArgs = [
  'firebase emulators:exec',
  '--log-verbosity',
  'SILENT',
  '--only',
  options.only,
  '--project',
  options.project,
].join(' ');

const command = `${firebaseArgs} '${fullCommand}'`;
console.log(`Running: ${command}`);

try {
  execSync(command, { stdio: 'inherit' });
} catch {
  process.exit(1);
}

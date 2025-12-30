import { Button, CopyButton, Stack, Text, TextInput } from '@mantine/core';

export const TokenDisplay = ({ token }: { token: string }) => (
  <Stack gap='sm'>
    <Text size='sm' c='dimmed'>
      Auth token has been generated.
    </Text>
    <TextInput value={token} readOnly />
    <CopyButton value={token}>
      {({ copied, copy }) => (
        <Button color={copied ? 'teal' : 'blue'} onClick={copy}>
          {copied ? 'Copied' : 'Copy Token'}
        </Button>
      )}
    </CopyButton>
  </Stack>
);

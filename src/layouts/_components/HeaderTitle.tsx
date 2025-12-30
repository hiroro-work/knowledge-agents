import { Group, Text } from '@mantine/core';
import Image from 'next/image';

export const HeaderTitle = () => {
  return (
    <Group gap='sm'>
      <Image src='/favicon.svg' alt='Logo' width={32} height={32} />
      <Text fw={600} size='lg'>
        Knowledge Agents
      </Text>
    </Group>
  );
};

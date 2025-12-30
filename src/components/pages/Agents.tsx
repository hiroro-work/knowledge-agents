'use client';

import { Card, Group, SimpleGrid, Stack, Text, Title, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { useMemo } from 'react';
import { InfiniteScrollArea } from '~/components/elements/InfiniteScrollArea';
import { ModalButton } from '~/components/elements/buttons/ModalButton';
import { AgentForm } from '~/components/forms/agent/AgentForm';
import { LoadingScreen } from '~/components/screens/LoadingScreen';
import { useAuth } from '~/contexts/auth';
import { useLayout } from '~/layouts/Layout';
import { agentsQuery, usePaginatedAgentCollection } from '~/models/agent';
import { AgentCard } from './_components/AgentCard';
import { TokenDisplay } from './_components/_components/TokenDisplay';

// Title row height (~40px) + Stack gap (lg=24px)
const CONTENT_OFFSET = 40 + 24;

export const Agents = () => {
  const { main } = useLayout();
  const contentHeight = main.height - CONTENT_OFFSET;
  const { firebaseUser, isAdmin, loading: loadingAuth } = useAuth();
  const currentUserId = firebaseUser?.uid;
  const query = useMemo(() => {
    return currentUserId ? agentsQuery() : null;
  }, [currentUserId]);
  const { data: agents, loading: loadingAgents, hasMore, loadMore } = usePaginatedAgentCollection(query, { limit: 12 });

  if (loadingAuth) return <LoadingScreen />;

  return (
    <Stack gap='lg'>
      <Group justify='space-between'>
        <Title order={2}>Agents</Title>
        <Tooltip label='Create' withArrow>
          <ModalButton
            variant='filled'
            size='compact-lg'
            px={10}
            modalProps={{ title: 'Create Agent' }}
            modalContent={({ close }) => (
              <AgentForm
                onSubmit={(result) => {
                  close();
                  if (result?.token) {
                    modals.open({
                      title: 'Auth Token',
                      children: <TokenDisplay token={result.token} />,
                    });
                  }
                }}
              />
            )}
          >
            <IconPlus size={18} />
          </ModalButton>
        </Tooltip>
      </Group>

      {agents.length > 0 || loadingAgents ? (
        <InfiniteScrollArea h={contentHeight} loading={loadingAgents} hasMore={hasMore} loadMore={loadMore}>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} currentUserId={currentUserId} isAdmin={isAdmin} />
            ))}
          </SimpleGrid>
        </InfiniteScrollArea>
      ) : (
        <Card shadow='sm' padding='xl' radius='md' withBorder>
          <Text ta='center' c='dimmed'>
            No agents have been created yet.
            <br />
            Click the + button in the upper right to create an agent.
          </Text>
        </Card>
      )}
    </Stack>
  );
};

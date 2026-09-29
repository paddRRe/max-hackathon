import { Button, Container, Flex, Grid, Panel, Typography } from '@maxhub/max-ui';
import { useWebApp } from './hooks/useWebApp';

// TODO(product): replace with the real product scenario after the
// problem/user is chosen. This is just the entry-point placeholder screen.
export default function App() {
  const { isMax, platform, version } = useWebApp();

  return (
    <Panel mode="secondary">
      <Container>
        <Grid gap={12} cols={1}>
          <Flex direction="column" align="center" gap={12}>
            <Typography.Title>Мой продукт в MAX</Typography.Title>
            <Typography.Body>
              Заглушка главного экрана. Место под основной сценарий — см. TODO в коде.
            </Typography.Body>
            <Typography.Label>
              {isMax
                ? `Открыто в MAX · платформа: ${platform} · версия: ${version}`
                : 'Dev-режим вне MAX (мок Bridge): platform=web'}
            </Typography.Label>
            {/* TODO(scenario): render the main user flow here */}
            <Button
              onClick={() => {
                // TODO(scenario): handle primary action
              }}
            >
              Продолжить
            </Button>
          </Flex>
        </Grid>
      </Container>
    </Panel>
  );
}

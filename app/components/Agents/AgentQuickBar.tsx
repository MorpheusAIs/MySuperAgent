import { Box, Tooltip, useMediaQuery } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import styles from './AgentQuickBar.module.css';

type AgentQuickBarProps = {
  selectedAgent?: string | null;
  onSelect: (agentName: string | null) => void;
};

type QuickAgent = { name: string; description: string; displayName?: string };

export const AgentQuickBar: React.FC<AgentQuickBarProps> = ({
  selectedAgent,
  onSelect,
}) => {
  const [agents, setAgents] = useState<QuickAgent[]>([]);
  const [isDesktop] = useMediaQuery('(min-width: 1280px)');
  const palette = [
    // Greens (site-accent leaning)
    '#59F886',
    '#45E07A',
    '#34C36A',
    '#22A85A',
    '#178A4A',
    // Blues
    '#89C2FF',
    '#5AA8FF',
    '#2E8BFF',
    '#1B6DDE',
    '#1557B0',
    // Fallbacks from your list
    '#a6d189',
    '#e5c890',
    '#ef9f76',
    '#ea999c',
    '#e78284',
    '#ca9ee6',
    '#f4b8e4',
    '#eebebe',
  ];

  useEffect(() => {
    if (!isDesktop) {
      setAgents([]);
      return;
    }

    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/agents/available?popular=true');
        const data = await res.json();
        const list: QuickAgent[] = (data.agents || []).map((a: any) => ({
          name: a.name,
          description: a.description,
          displayName: a.displayName,
        }));
        const sliced = list.filter((a) => a.name).slice(0, 8);
        if (active) setAgents(sliced);
      } catch (e) {
        console.error('Failed to load agents for quick bar', e);
        if (active)
          setAgents([
            {
              name: 'default',
              description: 'General assistant',
              displayName: 'Default',
            },
            {
              name: 'research',
              description: 'Research specialist',
              displayName: 'Research',
            },
          ]);
      }
    })();
    return () => {
      active = false;
    };
  }, [isDesktop]);

  if (!isDesktop || !agents.length) return null;

  const iconFor = (name: string): string => {
    const map: Record<string, string> = {
      default: '✨',
      research: '🔎',
      code: '💻',
      data: '📊',
      math: '➗',
      email_assistant: '✉️',
      meeting_coordinator: '📅',
      task_manager: '✅',
      api_developer: '🔧',
      code_reviewer: '🔍',
      dexscreener_backend: '🪙',
      crypto_data_backend: '📈',
      tweet_sizzler_backend: '🐦',
      imagen_backend: '🖼️',
    };
    return map[name] || '✨';
  };

  return (
    <div className={styles.container}>
      {agents.map((agent, idx) => {
        const label = agent.displayName || agent.name;
        const bg = palette[idx % palette.length];

        return (
          <Box key={agent.name} position="relative">
            <Tooltip label={label} placement="left" hasArrow>
              <button
                className={`${styles.agentButton} ${
                  selectedAgent === agent.name ? styles.agentButtonSelected : ''
                }`}
                onClick={() =>
                  onSelect(selectedAgent === agent.name ? null : agent.name)
                }
                aria-label={`Select ${agent.name}`}
                style={{ background: bg, borderColor: 'rgba(255,255,255,0.6)' }}
              >
                {iconFor(agent.name)}
              </button>
            </Tooltip>
          </Box>
        );
      })}
    </div>
  );
};

export default AgentQuickBar;

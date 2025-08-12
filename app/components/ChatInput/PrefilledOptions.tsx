import React, { useState, useEffect } from "react";
import {
  prefilledOptionsMap,
  OPTION_GROUPS,
} from "./PrefilledOptions.constants";
import styles from "./PrefilledOptions.module.css";

interface PrefilledOptionsProps {
  onSelect: (text: string) => void;
  isSidebarOpen: boolean;
  onExpandChange?: (isExpanded: boolean, selectedGroup: string | null) => void;
}

const PrefilledOptions: React.FC<PrefilledOptionsProps> = ({
  onSelect,
  isSidebarOpen = true,
  onExpandChange,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isExamplesPanelVisible, setIsExamplesPanelVisible] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Validate selectedGroup on mount and reset if invalid
  useEffect(() => {
    if (selectedGroup && !OPTION_GROUPS[selectedGroup as keyof typeof OPTION_GROUPS]) {
      setSelectedGroup(null);
    }
  }, [selectedGroup]);

  // Notify parent component about expansion state
  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(isExamplesPanelVisible, selectedGroup);
    }
  }, [selectedGroup, isExamplesPanelVisible, onExpandChange]);

  // This effect ensures panel visibility follows selected group state
  useEffect(() => {
    if (selectedGroup) {
      setIsExamplesPanelVisible(true);
    } else {
      setIsExamplesPanelVisible(false);
    }
  }, [selectedGroup]);

  const handleGroupClick = (group: string) => {
    if (selectedGroup === group) {
      setSelectedGroup(null);
    } else {
      setSelectedGroup(group);
    }
  };

  // Calculate container style with adjusted padding to avoid sidebar overlap
  const containerStyle = isMobile
    ? { width: "100%" }
    : {
        paddingLeft: isSidebarOpen ? "380px" : "100px", // Adjusted to be wider than the sidebar (360px)
        paddingRight: "20%",
        position: "relative" as const,
        zIndex: 100, // Ensure it's above content but below sidebar
      };

  const renderExamples = () => {
    if (!selectedGroup) return null;

    return (
      <div
        className={`${styles.examplesPanel} ${
          isExamplesPanelVisible ? styles.visible : ""
        }`}
      >
        {selectedGroup && OPTION_GROUPS[selectedGroup as keyof typeof OPTION_GROUPS]?.map(
          (agentType) => {
            const option =
              prefilledOptionsMap[
                agentType as keyof typeof prefilledOptionsMap
              ];
            if (!option) return null;

            return (
              <div key={agentType} className={styles.exampleGroup}>
                <div className={styles.exampleHeader}>
                  <span className={styles.exampleIcon}>{option.icon}</span>
                  <span className={styles.exampleTitle}>{option.title}</span>
                </div>
                <div className={styles.exampleButtons}>
                  {option.examples.map(
                    (example: { text: string }, index: number) => (
                      <button
                        key={index}
                        onClick={() => onSelect(example.text)}
                        className={styles.exampleButton}
                      >
                        {example.text}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    );
  };

  return (
    <div className={styles.prefilledContainer} style={containerStyle}>
      <div className={styles.prefilledInner}>
        <div className={styles.pillsContainer}>
          {Object.keys(OPTION_GROUPS).map((group) => (
            <button
              key={group}
              onClick={() => handleGroupClick(group)}
              className={`${styles.pillButton} ${
                selectedGroup === group ? styles.selected : ""
              }`}
            >
              {group}
            </button>
          ))}
        </div>
        {renderExamples()}
      </div>
    </div>
  );
};

export default PrefilledOptions;

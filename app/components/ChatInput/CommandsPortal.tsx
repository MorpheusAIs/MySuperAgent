import React from "react";
import { createPortal } from "react-dom";
import { Commands, Command } from "./Commands";

type CommandsPortalProps = {
  commands: Command[];
  selectedIndex: number;
  onSelect: (command: Command) => void;
  isSidebarOpen: boolean;
};

export const CommandsPortal: React.FC<CommandsPortalProps> = (props) => {
  React.useEffect(() => {
    const portalId = "commands-portal";
    if (!document.getElementById(portalId)) {
      const div = document.createElement("div");
      div.id = portalId;
      document.body.appendChild(div);
    }
  }, []);

  return createPortal(
    <Commands {...props} />,
    document.getElementById("commands-portal") || document.body
  );
};

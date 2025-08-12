import React, { FC, ComponentPropsWithoutRef } from "react"
import me from "../../public/assets/me.svg";
import { Avatar as CAvatar } from "@chakra-ui/react";


export interface AvatarProps extends ComponentPropsWithoutRef<'div'> {
    isAgent: boolean;
    agentName?: string;
}

export const Avatar: FC<AvatarProps> = ({ isAgent, agentName }: AvatarProps) => {
    if (isAgent) {
        return (
            <CAvatar name={agentName} w={'40px'} h={'40px'} />
        );
    }

    return (
        <CAvatar w={'40px'} h={'40px'} backgroundColor={'#FFF'} padding={2} colorScheme="gray" src={me.src} name={agentName} />
    );
}

import { Button, HStack, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spacer, Text, useDisclosure } from '@chakra-ui/react';
import { ConnectButton, useAccountModal, useConnectModal } from '@rainbow-me/rainbowkit';
import React, { FC, ComponentPropsWithoutRef, useEffect } from 'react';
import { useAccount } from 'wagmi';

export interface WalletRequiredModal extends ComponentPropsWithoutRef<'div'> {
    agentRequiresWallet: boolean;
}

export const WalletRequiredModal: FC<WalletRequiredModal> = ({ agentRequiresWallet }) => {

    const { address } = useAccount();
    const { openConnectModal } = useConnectModal();
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        if (!agentRequiresWallet) {
            if (isOpen) {
                onClose();
            }

            return;
        }

        if (!address && !isOpen) {
            onOpen();
        } else if (address && isOpen) {
            onClose();
        }
    }, [
        address,
        isOpen,
        agentRequiresWallet,
    ]);

    return (
        <>
            <Modal
                isCentered
                onClose={onClose}
                isOpen={isOpen}
                motionPreset='slideInBottom'
                closeOnOverlayClick={false}
            >
                <ModalOverlay />
                <ModalContent
                    sx={{
                        backgroundColor: '#353936',
                        borderColor: '#313137',
                        color: 'white',
                        borderRadius: '8px',
                        padding: 1,
                    }}
                >
                    <ModalHeader>Connect your wallet</ModalHeader>
                    <ModalBody>
                        <Text
                            sx={{
                                fontSize: '16px',
                                lineHeight: '18px',
                            }}
                        >
                            In order to use this agent you need to connect your wallet and select the correct network.
                        </Text>
                    </ModalBody>
                    <ModalFooter>
                        <HStack>
                            <Spacer />
                            <Button onClick={openConnectModal} variant={'greenCustom'} sx={{
                                pl: 7,
                                pr: 7,
                            }}>Connect</Button>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal >
        </>
    );
}

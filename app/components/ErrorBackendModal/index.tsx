import { Button, HStack, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spacer, Text, useDisclosure } from '@chakra-ui/react';
import { ConnectButton, useAccountModal, useConnectModal } from '@rainbow-me/rainbowkit';
import React, { FC, ComponentPropsWithoutRef, useEffect } from 'react';
import { useAccount } from 'wagmi';

export interface ErrorBackendModalProps extends ComponentPropsWithoutRef<'div'> {
    show: boolean;
}

export const ErrorBackendModal: FC<ErrorBackendModalProps> = ({ show }) => {

    const { isOpen, onOpen, onClose } = useDisclosure();
    const restartApp = () => {
        window.location.reload();
    }

    useEffect(() => {
        if (!show) {
            if (isOpen) {
                onClose();
            }

            return;
        }

        if (show && !isOpen) {
            onOpen();
        } else if (!show && isOpen) {
            onClose();
        }
    }, [show, isOpen]);



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
                    <ModalHeader>Agents unavailable</ModalHeader>
                    <ModalBody>
                        <Text
                            sx={{
                                fontSize: '16px',
                                lineHeight: '18px',
                            }}
                        >
                            It has not been possible to connect to any of the agents.
                            Please ensure that the Docker containers are running and the agent endpoints are correctly configured in config.ts.
                        </Text>
                    </ModalBody>
                    <ModalFooter>
                        <HStack>
                            <Spacer />
                            <Button onClick={restartApp} variant={'greenCustom'} sx={{
                                pl: 7,
                                pr: 7,
                            }}>Try Again</Button>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal >
        </>
    );
}

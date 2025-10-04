import { usePrivyAuth } from '@/contexts/auth/PrivyAuthProvider';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Mail, Wallet } from 'lucide-react';
import { ComponentPropsWithoutRef, FC, useEffect } from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import { useAccount } from 'wagmi';

export interface WalletRequiredModal extends ComponentPropsWithoutRef<'div'> {
  agentRequiresAuth: boolean;
}

export const WalletRequiredModal: FC<WalletRequiredModal> = ({
  agentRequiresAuth,
}) => {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isAuthenticated, loginWithGoogle, loginWithX, loginWithWallet } =
    usePrivyAuth();

  useEffect(() => {
    if (!agentRequiresAuth) {
      if (isOpen) {
        onClose();
      }

      return;
    }

    // Check if user is authenticated via Privy OR has wallet connected
    const hasAccess = isAuthenticated || !!address;

    if (!hasAccess && !isOpen) {
      onOpen();
    } else if (hasAccess && isOpen) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isOpen, agentRequiresAuth, isAuthenticated]);

  return (
    <>
      <Modal
        isCentered
        onClose={onClose}
        isOpen={isOpen}
        motionPreset="slideInBottom"
        closeOnOverlayClick={false}
      >
        <ModalOverlay />
        <ModalContent
          sx={{
            backgroundColor: '#27292c',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            borderRadius: '12px',
            padding: 4,
          }}
        >
          <ModalHeader>Sign In Required</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text
                sx={{
                  fontSize: '16px',
                  lineHeight: '1.5',
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                To use this feature, please sign in with one of the available
                methods:
              </Text>

              <VStack spacing={3}>
                <Button
                  onClick={loginWithGoogle}
                  leftIcon={<Mail size={20} />}
                  bg="#59F886"
                  color="#000"
                  _hover={{
                    bg: '#4AE066',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(89, 248, 134, 0.3)',
                  }}
                  size="lg"
                  width="full"
                  fontWeight="600"
                  borderRadius="8px"
                >
                  Sign in with Google
                </Button>

                <Button
                  onClick={loginWithX}
                  leftIcon={<FaXTwitter size={20} />}
                  bg="rgba(89, 248, 134, 0.2)"
                  color="#59F886"
                  border="1px solid #59F886"
                  _hover={{
                    bg: 'rgba(89, 248, 134, 0.3)',
                    transform: 'translateY(-1px)',
                  }}
                  size="lg"
                  width="full"
                  fontWeight="600"
                  borderRadius="8px"
                >
                  Sign in with X
                </Button>

                <Button
                  onClick={loginWithWallet}
                  leftIcon={<Wallet size={20} />}
                  bg="rgba(89, 248, 134, 0.2)"
                  color="#59F886"
                  border="1px solid #59F886"
                  _hover={{
                    bg: 'rgba(89, 248, 134, 0.3)',
                    transform: 'translateY(-1px)',
                  }}
                  size="lg"
                  width="full"
                  fontWeight="600"
                  borderRadius="8px"
                >
                  Sign in with Wallet
                </Button>
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

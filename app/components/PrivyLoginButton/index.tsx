import { Button, Menu, MenuButton, MenuItem, MenuList, HStack, Text, VStack, Icon, Box } from '@chakra-ui/react';
import { usePrivy } from '@privy-io/react-auth';
import { ChevronDown, LogIn, Mail, Wallet, LogOut, User } from 'lucide-react';
import { FaTwitter } from 'react-icons/fa';
import { usePrivyAuth } from '@/contexts/auth/PrivyAuthProvider';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

interface PrivyLoginButtonProps {
  variant?: 'header' | 'sidebar';
  size?: 'sm' | 'md';
}

export const PrivyLoginButton = ({ variant = 'header', size = 'md' }: PrivyLoginButtonProps) => {
  const { 
    ready, 
    authenticated, 
    user,
    login,
    logout: privyLogout,
  } = usePrivy();
  
  const { 
    loginWithGoogle, 
    loginWithWallet, 
    loginWithTwitter,
    logout,
    userEmail,
    userWallet,
    isAuthenticated
  } = usePrivyAuth();

  const { address } = useAccount();

  // Handle loading state
  if (!ready) {
    return (
      <Button
        isLoading
        loadingText="Loading..."
        bg="rgba(89, 248, 134, 0.15)"
        color="#59F886"
        borderColor="#59F886"
        borderWidth="1px"
        size="md"
        borderRadius="md"
        _hover={{
          bg: "rgba(89, 248, 134, 0.25)",
        }}
      />
    );
  }

  // Handle authenticated state
  if (authenticated && user) {
    const displayName = userEmail || userWallet || user.id.slice(0, 8);
    const shortDisplay = displayName.length > 20 
      ? `${displayName.slice(0, 8)}...${displayName.slice(-4)}`
      : displayName;

    // Sidebar variant - more compact display
    if (variant === 'sidebar') {
      return (
        <VStack spacing={3} align="stretch">
          <VStack spacing={2} align="stretch">
            <HStack spacing={2} justify="center">
              <User size={18} color="#59F886" />
              <Text fontSize="sm" fontWeight="600" color="white" textAlign="center">
                Signed In
              </Text>
            </HStack>
            <Text 
              fontSize="xs" 
              fontWeight="400" 
              color="rgba(255, 255, 255, 0.7)"
              textAlign="center"
              fontFamily={userWallet ? "mono" : "inherit"}
            >
              {shortDisplay}
            </Text>
            <Box
              height="1px"
              bg="rgba(255, 255, 255, 0.1)"
              width="100%"
              my={1}
            />
          </VStack>
          <Button
            onClick={logout}
            size="sm"
            bg="rgba(255, 255, 255, 0.05)"
            color="rgba(255, 255, 255, 0.8)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            _hover={{
              bg: "rgba(255, 0, 0, 0.1)",
              borderColor: "#ff4444",
              color: "#ff4444",
              transform: "translateY(-1px)",
            }}
            leftIcon={<LogOut size={14} />}
            fontSize="xs"
            fontWeight="500"
            borderRadius="8px"
            transition="all 0.2s"
          >
            Sign Out
          </Button>
        </VStack>
      );
    }

    // Header variant - dropdown menu
    return (
      <Menu>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDown size={16} />}
          bg="rgba(89, 248, 134, 0.1)"
          color="#59F886"
          borderColor="#59F886"
          borderWidth="1px"
          _hover={{
            bg: "rgba(89, 248, 134, 0.2)",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(89, 248, 134, 0.2)",
          }}
          _active={{
            bg: "rgba(89, 248, 134, 0.3)",
          }}
          size={size}
          borderRadius="md"
          transition="all 0.2s"
        >
          <HStack spacing={2}>
            <User size={16} />
            <Text fontSize="sm" fontWeight="500">{shortDisplay}</Text>
          </HStack>
        </MenuButton>
        <MenuList
          bg="#27292c"
          borderColor="rgba(255, 255, 255, 0.2)"
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.5)"
        >
          <MenuItem
            bg="transparent"
            color="rgba(255, 255, 255, 0.9)"
            _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
            isDisabled
          >
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)">Logged in as</Text>
              <Text fontSize="sm" fontWeight="500">
                {userEmail && (
                  <HStack spacing={1}>
                    <Mail size={12} />
                    <Text>{userEmail}</Text>
                  </HStack>
                )}
                {userWallet && (
                  <HStack spacing={1}>
                    <Wallet size={12} />
                    <Text>{`${userWallet.slice(0, 6)}...${userWallet.slice(-4)}`}</Text>
                  </HStack>
                )}
                {!userEmail && !userWallet && (
                  <Text>User ID: {user.id.slice(0, 12)}...</Text>
                )}
              </Text>
            </VStack>
          </MenuItem>
          <MenuItem
            icon={<LogOut size={16} />}
            onClick={logout}
            bg="transparent"
            color="rgba(255, 255, 255, 0.9)"
            _hover={{ bg: "rgba(255, 0, 0, 0.1)", color: "#ff4444" }}
            transition="all 0.2s"
          >
            Sign Out
          </MenuItem>
        </MenuList>
      </Menu>
    );
  }

  // Handle unauthenticated state
  
  // Sidebar variant - vertical buttons
  if (variant === 'sidebar') {
    return (
      <VStack spacing={3} align="stretch">
        <VStack spacing={2} align="stretch">
          <Text fontSize="sm" fontWeight="600" color="white" textAlign="center">
            Sign In
          </Text>
          <Text fontSize="xs" color="rgba(255, 255, 255, 0.7)" textAlign="center">
            Choose your preferred method
          </Text>
          <Box
            height="1px"
            bg="rgba(255, 255, 255, 0.1)"
            width="100%"
            my={1}
          />
        </VStack>
        <VStack spacing={2} align="stretch">
          <Button
            onClick={loginWithGoogle}
            leftIcon={<Mail size={14} />}
            size="sm"
            bg="#59F886"
            color="#000"
            _hover={{
              bg: "#4AE066",
              transform: "translateY(-1px)",
            }}
            fontSize="xs"
            fontWeight="600"
            borderRadius="8px"
            transition="all 0.2s"
          >
            Google
          </Button>
          <Button
            onClick={loginWithTwitter}
            leftIcon={<Icon as={FaTwitter} boxSize="14px" />}
            size="sm"
            bg="rgba(255, 255, 255, 0.05)"
            color="#59F886"
            border="1px solid rgba(89, 248, 134, 0.3)"
            _hover={{
              bg: "rgba(89, 248, 134, 0.1)",
              borderColor: "#59F886",
              transform: "translateY(-1px)",
            }}
            fontSize="xs"
            fontWeight="500"
            borderRadius="8px"
            transition="all 0.2s"
          >
            Twitter
          </Button>
          <Button
            onClick={loginWithWallet}
            leftIcon={<Wallet size={14} />}
            size="sm"
            bg="rgba(255, 255, 255, 0.05)"
            color="#59F886"
            border="1px solid rgba(89, 248, 134, 0.3)"
            _hover={{
              bg: "rgba(89, 248, 134, 0.1)",
              borderColor: "#59F886",
              transform: "translateY(-1px)",
            }}
            fontSize="xs"
            fontWeight="500"
            borderRadius="8px"
            transition="all 0.2s"
          >
            Wallet
          </Button>
        </VStack>
      </VStack>
    );
  }

  // Header variant - dropdown menu
  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDown size={16} />}
        bg="rgba(89, 248, 134, 0.15)"
        color="#59F886"
        borderColor="#59F886"
        borderWidth="1px"
        _hover={{
          bg: "rgba(89, 248, 134, 0.25)",
          transform: "translateY(-1px)",
          boxShadow: "0 4px 12px rgba(89, 248, 134, 0.3)",
        }}
        _active={{
          bg: "rgba(89, 248, 134, 0.35)",
        }}
        size={size}
        borderRadius="md"
        fontWeight="600"
        transition="all 0.2s"
      >
        <HStack spacing={2}>
          <LogIn size={16} />
          <Text color="#59F886" fontWeight="600">Sign In</Text>
        </HStack>
      </MenuButton>
      <MenuList
        bg="#27292c"
        borderColor="rgba(255, 255, 255, 0.2)"
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.5)"
      >
        <MenuItem
          icon={<Mail size={16} />}
          onClick={loginWithGoogle}
          bg="transparent"
          color="rgba(255, 255, 255, 0.9)"
          _hover={{ bg: "rgba(89, 248, 134, 0.2)", color: "#59F886" }}
          transition="all 0.2s"
        >
          Sign in with Google
        </MenuItem>
        <MenuItem
          icon={<Icon as={FaTwitter} boxSize="16px" />}
          onClick={loginWithTwitter}
          bg="transparent"
          color="rgba(255, 255, 255, 0.9)"
          _hover={{ bg: "rgba(89, 248, 134, 0.2)", color: "#59F886" }}
          transition="all 0.2s"
        >
          Sign in with Twitter
        </MenuItem>
        <MenuItem
          icon={<Wallet size={16} />}
          onClick={loginWithWallet}
          bg="transparent"
          color="rgba(255, 255, 255, 0.9)"
          _hover={{ bg: "rgba(89, 248, 134, 0.2)", color: "#59F886" }}
          transition="all 0.2s"
        >
          Sign in with Wallet
        </MenuItem>
      </MenuList>
    </Menu>
  );
};
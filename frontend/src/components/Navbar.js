import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Flex, Link, Button } from '@chakra-ui/react';

function Navbar() {
  return (
    <Box bg="gray.800" px={4} py={2}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Flex alignItems="center">
          <Link as={RouterLink} to="/" color="white" fontWeight="bold">
            Defi Dungeons Calculator
          </Link>
        </Flex>
        <Flex alignItems="center" gap={4}>
          <Link as={RouterLink} to="/gold-tracker" color="white">
            Gold Tracker
          </Link>
          <Link as={RouterLink} to="/dungeon-calculator" color="white">
            Dungeon Calculator
          </Link>
        </Flex>
      </Flex>
    </Box>
  );
}

export default Navbar; 
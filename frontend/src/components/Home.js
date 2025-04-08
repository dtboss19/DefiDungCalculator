import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';

function Home() {
  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading>Welcome to Defi Dungeons Calculator</Heading>
        <Text>Use the navigation bar to access different tools:</Text>
        <Text>- Gold Tracker: View your earnings and daily stats</Text>
        <Text>- Dungeon Calculator: Calculate dungeon rewards and efficiency</Text>
      </VStack>
    </Box>
  );
}

export default Home; 
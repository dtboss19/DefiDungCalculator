import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import GoldTracker from './components/GoldTracker';
import DungeonCalculator from './components/DungeonCalculator';

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gold-tracker" element={<GoldTracker />} />
          <Route path="/dungeon-calculator" element={<DungeonCalculator />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;

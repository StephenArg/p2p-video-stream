import React from 'react';
import styles from './App.module.css';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home/Home';

function App() {
  return (
    <div className={styles.App}>
      <header className={styles['App-header']}>
        <Routes>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="*" element={<div>404: No route</div>} />
        </Routes>
      </header>
    </div>
  );
}

export default App;

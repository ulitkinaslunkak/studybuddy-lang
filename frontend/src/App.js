import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LessonList from './components/LessonList';
import LessonDetails from './components/LessonDetails';
import Navbar from './components/Navbar';
import Profile from './components/Profile';
import MainPage from './components/MainPage'; 
import LessonEdit from './components/LessonEdit';
import './index.css';


function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar /> 
        <Routes>
          <Route path="/" element={<LessonList />} />
          <Route path="/main" element={<MainPage />} /> 
          <Route path="/lessons/:id" element={<LessonDetails />} /> 
          <Route path="/profile" element={<Profile />} /> 
          <Route path="/lessons/edit/:id" element={<LessonEdit />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;



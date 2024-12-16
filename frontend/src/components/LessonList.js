import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './LessonList.css';

const LessonList = () => {
  const [lessons, setLessons] = useState([]); 
  const [filteredLessons, setFilteredLessons] = useState([]); 
  const [error, setError] = useState(null);
  const [languageFilter, setLanguageFilter] = useState(''); 
  const [difficultyFilter, setDifficultyFilter] = useState(''); 
  const [sortOrder, setSortOrder] = useState('');  
  const [dateSortOrder, setDateSortOrder] = useState(''); 

  const difficultyOrder = {
    'Начальный': 1,
    'Средний': 2,
    'Сложный': 3,
  };

  const filterAndSortLessons = () => {
    let filtered = [...lessons];

    if (languageFilter) {
      filtered = filtered.filter((lesson) => lesson.language === languageFilter);
    }

    if (difficultyFilter) {
      filtered = filtered.filter((lesson) => lesson.difficulty_level === difficultyFilter);
      if (difficultyFilter === 'Начальный') {
        document.body.classList.add('difficulty-easy');
        document.body.classList.remove('difficulty-medium', 'difficulty-hard');
      } else if (difficultyFilter === 'Средний') {
        document.body.classList.add('difficulty-medium');
        document.body.classList.remove('difficulty-easy', 'difficulty-hard');
      } else if (difficultyFilter === 'Сложный') {
        document.body.classList.add('difficulty-hard');
        document.body.classList.remove('difficulty-easy', 'difficulty-medium');
      }
    }

    if (!languageFilter && !difficultyFilter) {
      document.body.classList.add('light-theme'); 
      document.body.classList.remove('difficulty-easy', 'difficulty-medium', 'difficulty-hard');
    } else {
      document.body.classList.remove('light-theme'); 
    }

    if (sortOrder) {
      const orderMultiplier = sortOrder === 'asc' ? 1 : -1;
      filtered.sort((a, b) => {
        return (difficultyOrder[a.difficulty_level] - difficultyOrder[b.difficulty_level]) * orderMultiplier;
      });
    }

    if (dateSortOrder) {
      const orderMultiplier = dateSortOrder === 'asc' ? 1 : -1;
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt); 
        const dateB = new Date(b.createdAt); 
        return (dateA - dateB) * orderMultiplier;
      });
    }

    setFilteredLessons(filtered); 
  };

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch('http://localhost:5000/lessons');
        if (!response.ok) {
          throw new Error('Не удалось загрузить уроки');
        }
        const data = await response.json();
        setLessons(data); 
        setFilteredLessons(data); 
      } catch (error) {
        setError(error.message); 
      }
    };

    fetchLessons(); 
  }, []);

  useEffect(() => {
    filterAndSortLessons();
  }, [languageFilter, difficultyFilter, sortOrder, dateSortOrder]); 

  return (
    <div className="lesson-list">
      <div className="filter-controls">
        <div className="filter">
          <label htmlFor="language">Язык</label>
          <select
            id="language"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
          >
            <option value="">Все языки</option>
            <option value="Испанский">Испанский</option>
            <option value="Английский">Английский</option>
          </select>
        </div>

        <div className="filter">
          <label htmlFor="difficulty">Сложность</label>
          <select
            id="difficulty"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="">Все уровни</option>
            <option value="Начальный">Начальный</option>
            <option value="Средний">Средний</option>
            <option value="Сложный">Сложный</option>
          </select>
        </div>

        <div className="filter">
          <label htmlFor="sortOrder">Сортировка по сложности</label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="">Без сортировки</option>
            <option value="asc">От начального к сложному</option>
            <option value="desc">От сложного к начальному</option>
          </select>
        </div>

        <div className="filter">
          <label htmlFor="dateSortOrder">Сортировка по времени</label>
          <select
            id="dateSortOrder"
            value={dateSortOrder}
            onChange={(e) => setDateSortOrder(e.target.value)}
          >
            <option value="">Без сортировки</option>
            <option value="asc">От более давних к более новым</option>
            <option value="desc">От более новых к более давним</option>
          </select>
        </div>
      </div>

      <div className="lesson-cards">
        <h1>Список Уроков</h1>

        {error && <p className="error-message">{error}</p>}

        {filteredLessons.length > 0 ? (
          filteredLessons.map((lesson) => (
            <Link key={lesson._id} to={`/lessons/${lesson._id}`} className="lesson-card">
              <h2>{lesson.title}</h2>
              <p>{lesson.description}</p>
              <p><strong>Язык:</strong> {lesson.language}</p>
              <p><strong>Уровень сложности:</strong> {lesson.difficulty_level}</p>
              <p><strong>Дата создания:</strong> {new Date(lesson.createdAt).toLocaleDateString()}</p> {/* используем createdAt */}
            </Link>
          ))
        ) : (
          <p>Нет доступных уроков для выбранных фильтров.</p>
        )}
      </div>
    </div>
  );
};

export default LessonList;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import icon from '../assets/icons/play.png';
import Quiz from './Quiz'; 
import LessonReviews from './LessonReviews'; 
import './LessonDetails.css';

function LessonDetails() {
  const { id } = useParams(); 
  const [lesson, setLesson] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [openWords, setOpenWords] = useState({}); 
  const [likes, setLikes] = useState(0); 
  const [userLiked, setUserLiked] = useState(false); 
  const [currentUserId, setCurrentUserId] = useState(null); 
  const [user, setUser] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 
  const [editedLesson, setEditedLesson] = useState(null); 

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(decoded.userId);
      
      axios.get('http://localhost:5000/users/me', {
        headers: { Authorization: `${token}` },
      })
      .then((response) => {
        setUser(response.data);
      })
      .catch((error) => {
        console.error("Ошибка при получении данных пользователя:", error);
      });
    }
  }, []);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/lessons/${id}`);
        setLesson(response.data); 
        const likeCount = Array.isArray(response.data.likes) ? response.data.likes.length : response.data.likes || 0;
        setLikes(likeCount);

        setUserLiked(response.data.userLiked || false);
        setLoading(false);
      } catch (err) {
        setError('Не удалось загрузить урок'); 
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]); 

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedLesson(lesson); 
  };

  const handleSaveClick = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Вы не авторизованы!');

    try {
      await axios.put(`http://localhost:5000/lessons/${id}`, editedLesson, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLesson(editedLesson); 
      setIsEditing(false); 
    } catch (err) {
      console.error('Ошибка при сохранении изменений:', err);
      alert('Ошибка при сохранении изменений');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedLesson((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWordClick = (index) => {
    setOpenWords((prev) => ({
      ...prev,
      [index]: !prev[index], 
    }));
  };

  const handleDeleteLesson = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Вы не авторизованы!');

    try {
      await axios.delete(`http://localhost:5000/lessons/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Урок успешно удален!');
    } catch (err) {
      console.error('Ошибка при удалении урока:', err);
      alert('Ошибка при удалении урока');
    }
  };

  const updateUserPoints = async (points) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Токен отсутствует');
      return;
    }
  
    try {
      const response = await axios.post(
        'http://localhost:5000/users/add-points',
        { points }, 
        {
          headers: { 
            Authorization: `Bearer ${token}`, 
          },
        }
      );
      console.log('Баллы успешно начислены:', response.data);
    } catch (err) {
      console.error('Ошибка при начислении баллов:', err.response?.data || err.message);
    }
  };
  
  const handleScrollEnd = () => {
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 50;

    if (scrollPosition >= threshold) {
      updateUserPoints(10); // +10 баллов за скролл
      window.removeEventListener('scroll', handleScrollEnd);
    }
  };

  const handlePlayAudio = () => {
    updateUserPoints(5); // +5 баллов за проигрывание аудио
  };

  const handlePlayVideo = () => {
    updateUserPoints(5); // +5 баллов за просмотр видео
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScrollEnd);
    return () => window.removeEventListener('scroll', handleScrollEnd);
  }, []);

  const handleLike = async () => {
    if (userLiked) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Пожалуйста, войдите в систему!');
        return;
      }

      const response = await axios.post(`http://localhost:5000/lessons/${id}/like`, {}, {
        headers: { 'Authorization': `${token}` },
      });

      if (response.data.message === 'Лайк успешно добавлен') {
        setLikes(response.data.likesCount);
        setUserLiked(true);
      }
    } catch (err) {
      console.error('Ошибка при добавлении лайка:', err);
      alert('Ошибка при добавлении лайка');
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!lesson) {
    return <div>Урок не найден.</div>;
  }

  const content = lesson.content || {};
  const textFragments = content.text_fragments || [];
  const audioFiles = content.audio || [];
  const videoFiles = content.video || [];
  const pictures = content.pictures || [];

  return (
    <div className="lesson-details">
      <div className="lesson-form">
        <h1 className="centered-header">{lesson.title}</h1>
        <p>{lesson.description}</p>

        {lesson.createdBy === currentUserId && !isEditing && (
          <button onClick={handleEditClick}>Редактировать</button>
        )}

        {isEditing && (
          <div>
            <h2>Редактировать урок</h2>
            <div>
              <label>
                Заголовок:
                <input
                  type="text"
                  name="title"
                  value={editedLesson.title}
                  onChange={handleInputChange}
                />
              </label>
            </div>
            <div>
              <label>
                Описание:
                <textarea
                  name="description"
                  value={editedLesson.description}
                  onChange={handleInputChange}
                />
              </label>
            </div>
            <div>
          <label>Язык</label>
          <select
            name="language"
            value={lesson.language}
            onChange={handleInputChange}
          >
            <option value="Испанский">Испанский</option>
            <option value="Английский">Английский</option>
          </select>
        </div>
        <div>
          <label>Уровень сложности</label>
          <select
            name="difficulty_level"
            value={lesson.difficulty_level}
            onChange={handleInputChange}
          >
            <option value="Начальный">Начальный</option>
            <option value="Средний">Средний</option>
            <option value="Сложный">Сложный</option>
          </select>
        </div>
            <button onClick={handleSaveClick}>Сохранить изменения</button>
          </div>
        )}

        <p><strong>Язык:</strong> {lesson.language}</p>
        <p><strong>Уровень сложности:</strong> {lesson.difficulty_level}</p>

        <div className="like-section" style={{ marginTop: '20px' }}>
          <button
            onClick={handleLike}
            disabled={userLiked}
            style={{
              backgroundColor: userLiked ? '#FF0000' : '#007BFF',
              color: '#fff',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: userLiked ? 'not-allowed' : 'pointer',
              marginRight: '10px',
            }}
          >
            {userLiked ? 'Лайк поставлен' : 'Поставить лайк'}
          </button>
          <span className="likes-text">
            {likes} {likes === 1 ? 'лайк' : 'лайков'}
          </span>
        </div>

        <h2 className="centered-header">Содержание урока</h2>

        {/*текстовые фрагменты */}
        <h2 className="centered-header">Текстовые фрагменты</h2>
        {textFragments.length > 0 ? (
          <ul>
            {textFragments.map((item, index) => (
              <li key={index} style={{ marginBottom: '15px' }}>
                <strong>{item.text}</strong>
                <br />
                <em>{item.translation}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p>Нет текстовых фрагментов.</p>
        )}

        <h2 className="centered-header">Аудиофайлы для тренировки наслышанности</h2>
        {audioFiles.length > 0 ? (
          audioFiles.map((audio) => (
            <div key={audio._id}>
              <p>{audio.description}</p>
              <audio controls onPlay={handlePlayAudio}>
                <source src={`http://localhost:5000/${audio.file}`} type="audio/mpeg" />
                Ваш браузер не поддерживает аудио.
              </audio>
            </div>
          ))
        ) : (
          <p>Нет аудиофайлов.</p>
        )}

        <h2 className="centered-header">Видеоролик</h2>
        {videoFiles.length > 0 ? (
          videoFiles.map((video) => (
            <div key={video._id}>
              <p>{video.description}</p>
              <video width="100%" controls onPlay={handlePlayVideo}>
                <source src={`http://localhost:5000/${video.file}`} type="video/mp4" />
                Ваш браузер не поддерживает видео.
              </video>
            </div>
          ))
        ) : (
          <p>Нет видеороликов.</p>
        )}

        <h2 className="centered-header">Фотографии</h2>
        {pictures.length > 0 ? (
          pictures.map((picture) => (
            <div key={picture._id}>
              <p>{picture.description}</p>
              <img
                src={`http://localhost:5000/${picture.file}`}
                alt={picture.description}
                style={{ maxWidth: '100%' }}
              />
            </div>
          ))
        ) : (
          <p>Нет изображений.</p>
        )}

        {/*словарь*/}
        <h2 className="centered-header">Ваши новые слова за урок</h2>
        <ul>
          {lesson.vocabulary && lesson.vocabulary.length > 0 ? (
            lesson.vocabulary.map((item, index) => (
              <li key={index} style={{ listStyleType: 'none', display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <img src={icon} alt="Icon" style={{ width: '20px', height: '20px', marginRight: '10px' }} />
                <div
                  onClick={() => handleWordClick(index)}
                  style={{
                    cursor: 'pointer',
                    display: 'inline-block',
                    backgroundColor: '#f0f0f0',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    margin: '5px',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <strong>{item.word}</strong>
                </div>
                {openWords[index] && (
                  <div style={{ marginTop: '5px', paddingLeft: '20px' }}>
                    <em>{item.translation}</em>
                  </div>
                )}
              </li>
            ))
          ) : (
            <li>Нет данных о словах</li>
          )}
        </ul>

        {/*квиз*/}
        {lesson.quiz && lesson.quiz.length > 0 && <Quiz quizData={lesson.quiz} 
        onQuizSubmit={() => updateUserPoints(5)} 
        />}

        <LessonReviews lessonId={id} 
         onReviewSubmit={() => updateUserPoints(5)} 
         />
        {lesson && user && lesson.createdBy === user._id && (
          <button onClick={handleDeleteLesson}>Удалить урок</button>
        )}
      </div>
    </div>
  );
}

export default LessonDetails;


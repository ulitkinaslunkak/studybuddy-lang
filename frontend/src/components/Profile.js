import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Profile.css'; 

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    language: '',
    difficulty_level: '',
    content: {
      text_fragments: [{ text: '', translation: '' }],
      audio: [{ file: '', description: '' }],
      video: [{ file: '', description: '' }],
      pictures: [{ file: '', description: '' }],
    },
    vocabulary: [{ word: '', translation: '' }],
    quiz: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }],
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile(token);
    }
  }, []);

  const fetchProfile = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/profile', {
        headers: {
          Authorization: token,
        },
      });
      setUser(response.data);
    } catch (err) {
      console.error('Ошибка при загрузке профиля:', err.response?.data || err.message);
      setError('Ошибка при загрузке данных профиля');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/login', { email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      setSuccessMessage('Ура, вы успешно вошли!');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError('Неверный логин или пароль');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSuccessMessage('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/register', { email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      setSuccessMessage('Вы успешно зарегистрировались!');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError('Ошибка при регистрации');
    }
  };


  const handleCreateLesson = () => {
    setShowLessonForm(true);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    const formData = new FormData();
  
    formData.append('title', lessonData.title);
    formData.append('description', lessonData.description);
    formData.append('language', lessonData.language);
    formData.append('difficulty_level', lessonData.difficulty_level);
  
    lessonData.content.audio.forEach((audio) => {
      if (audio.file instanceof File) {
        formData.append('audio', audio.file); 
      }
    });
  
    lessonData.content.video.forEach((video) => {
      if (video.file instanceof File) {
        formData.append('video', video.file); 
      }
    });
  
    lessonData.content.pictures.forEach((picture) => {
      if (picture.file instanceof File) {
        formData.append('pictures', picture.file); 
      }
    });
  
    formData.append('audioDescriptions', JSON.stringify(
      lessonData.content.audio.map(audio => audio.description)
    ));
    formData.append('videoDescriptions', JSON.stringify(
      lessonData.content.video.map(video => video.description)
    ));
    formData.append('pictureDescriptions', JSON.stringify(
      lessonData.content.pictures.map(picture => picture.description)
    ));
  
    formData.append('content', JSON.stringify({
      text_fragments: lessonData.content.text_fragments,
    }));
    formData.append('vocabulary', JSON.stringify(lessonData.vocabulary));
    formData.append('quiz', JSON.stringify(lessonData.quiz));
  
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/lessons', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Урок успешно создан!');
      setShowLessonForm(false);
    } catch (err) {
      console.error('Ошибка при создании урока:', err.response?.data || err.message);
      alert('Ошибка при создании урока');
    }
  };
  

  const handleLessonInputChange = (e) => {
    const { name, value } = e.target;
    setLessonData({ ...lessonData, [name]: value });
  };

  const handleInputChangeInArray = (path, index, field, value) => {
    const keys = path.split('.');
    let target = lessonData;
    
    for (let key of keys) {
      target = target[key];
    }
  
    if (Array.isArray(target)) {
      if (field === '') {
        target[index] = value; 
      } else {
        target[index][field] = value; 
      }
    } else if (typeof target === 'object') {
      target[field] = value; 
    }
  
    setLessonData({ ...lessonData });
  };
  
  
  const handleAddItem = (path) => {
    const keys = path.split('.');
    let target = lessonData;
    for (let key of keys.slice(0, -1)) target = target[key];
    target[keys[keys.length - 1]].push({ file: '', description: '' });
    setLessonData({ ...lessonData });
  };

  const handleRemoveItem = (path, index) => {
    const keys = path.split('.');
    let target = lessonData;
    for (let key of keys.slice(0, -1)) target = target[key];
    target[keys[keys.length - 1]].splice(index, 1);
    setLessonData({ ...lessonData });
  };

  const getMessageByPoints = (points) => {
    if (points < 1000) {
      return 'Ваш статус: Вы еще маленький котеночек, но двигайтесь вперед и у вас обязательно все получится!';
    } else if (points < 10000) {
      return 'Ваш статус: Вы уже уверенно владеете языком, так держать!';
    } else {
      return 'Ваш статус: Вы просто гуру языка, вдохновляйте других своим опытом и как можно больше практикуйтесь!';
    }
  };
    
  if (user) {
    const message = getMessageByPoints(user.points || 0);
    return (
      <div >
        <h1>Добро пожаловать, {user.name || 'ученик!'}</h1>
        <p>Email: {user.email}</p>
        <p>Дата регистрации: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Неизвестно'}</p>
        <p>Ваши баллы: {user.points || 0}</p> {/*отображение баллов*/}
        <p>{message}</p> {/*отображение сообщения о прогрессе*/}
        <button onClick={handleLogout}>Выйти</button>
        <button onClick={handleCreateLesson}>Создать урок</button>

        {showLessonForm && (
          <form onSubmit={handleSaveLesson}>
            <h2>Добавить урок</h2>
            <input
              type="text"
              name="title"
              placeholder="Название урока"
              value={lessonData.title}
              onChange={handleLessonInputChange}
              required
            />
            <textarea
              name="description"
              placeholder="Описание урока"
              value={lessonData.description}
              onChange={handleLessonInputChange}
              required
            ></textarea>
            <select name="language" value={lessonData.language} onChange={handleLessonInputChange} required>
                <option value="">Выберите язык</option>
                <option value="Английский">Английский</option>
                <option value="Испанский">Испанский</option>
            </select>
            <select
                name="difficulty_level"
                value={lessonData.difficulty_level}
                onChange={handleLessonInputChange}
                required
            >
                <option value="">Выберите уровень сложности</option>
                <option value="Начальный">Начальный</option>
                <option value="Средний">Средний</option>
                <option value="Сложный">Сложный</option>
            </select>

            {/*текст*/}
            <h3>Текстовые фрагменты</h3>
            {lessonData.content.text_fragments.map((fragment, index) => (
              <div key={index}>
                <input
                  type="text"
                  placeholder="Текст"
                  value={fragment.text}
                  onChange={(e) =>
                    handleInputChangeInArray('content.text_fragments', index, 'text', e.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder="Перевод"
                  value={fragment.translation}
                  onChange={(e) =>
                    handleInputChangeInArray('content.text_fragments', index, 'translation', e.target.value)
                  }
                />
                <button type="button" onClick={() => handleRemoveItem('content.text_fragments', index)}>Удалить</button>
              </div>
            ))}
            <button type="button" onClick={() => handleAddItem('content.text_fragments')}>Добавить текст</button>

            {/*аудио*/}
            <h3>Аудио</h3>
            {lessonData.content.audio.map((audio, index) => (
              <div key={index}>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) =>
                    handleInputChangeInArray('content.audio', index, 'file', e.target.files[0])
                  }
                />
                <input
                  type="text"
                  placeholder="Описание"
                  value={audio.description}
                  onChange={(e) =>
                    handleInputChangeInArray('content.audio', index, 'description', e.target.value)
                  }
                />
                <button type="button" onClick={() => handleRemoveItem('content.audio', index)}>Удалить</button>
              </div>
            ))}
            <button type="button" onClick={() => handleAddItem('content.audio')}>Добавить аудио</button>

            {/*видео*/}
            <h3>Видео</h3>
            {lessonData.content.video.map((video, index) => (
              <div key={index}>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    handleInputChangeInArray('content.video', index, 'file', e.target.files[0])
                  }
                />
                <input
                  type="text"
                  placeholder="Описание"
                  value={video.description}
                  onChange={(e) =>
                    handleInputChangeInArray('content.video', index, 'description', e.target.value)
                  }
                />
                <button type="button" onClick={() => handleRemoveItem('content.video', index)}>Удалить</button>
              </div>
            ))}
            <button type="button" onClick={() => handleAddItem('content.video')}>Добавить видео</button>

            {/*картинки*/}
            <h3>Изображения</h3>
            {lessonData.content.pictures.map((picture, index) => (
              <div key={index}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleInputChangeInArray('content.pictures', index, 'file', e.target.files[0])
                  }
                />
                <input
                  type="text"
                  placeholder="Описание"
                  value={picture.description}
                  onChange={(e) =>
                    handleInputChangeInArray('content.pictures', index, 'description', e.target.value)
                  }
                />
                <button type="button" onClick={() => handleRemoveItem('content.pictures', index)}>Удалить</button>
              </div>
            ))}
            <button type="button" onClick={() => handleAddItem('content.pictures')}>Добавить изображение</button>

            {/*словарь*/}
            <h3>Словарь</h3>
            {lessonData.vocabulary.map((word, index) => (
              <div key={index}>
                <input
                  type="text"
                  placeholder="Слово"
                  value={word.word}
                  onChange={(e) =>
                    handleInputChangeInArray('vocabulary', index, 'word', e.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder="Перевод"
                  value={word.translation}
                  onChange={(e) =>
                    handleInputChangeInArray('vocabulary', index, 'translation', e.target.value)
                  }
                />
                <button type="button" onClick={() => handleRemoveItem('vocabulary', index)}>Удалить</button>
              </div>
            ))}
            <button type="button" onClick={() => handleAddItem('vocabulary')}>Добавить слово</button>

            {/*квиз*/}
            <h3>Викторина</h3>
            {lessonData.quiz.map((question, index) => (
                <div key={index}>
                    <input
                    type="text"
                    placeholder="Вопрос"
                    value={question.question}
                    onChange={(e) =>
                        handleInputChangeInArray('quiz', index, 'question', e.target.value)
                    }
                    />
                    {question.options.map((option, optionIndex) => (
                    <div key={optionIndex}>
                        <input
                        type="text"
                        placeholder={`Опция ${optionIndex + 1}`}
                        value={option}
                        onChange={(e) =>
                            handleInputChangeInArray(`quiz.${index}.options`, optionIndex, '', e.target.value)  // Здесь ошибка, нужно исправить
                        }
                        />
                    </div>
                    ))}
                    <input
                    type="number"
                    placeholder="Номер правильного ответа"
                    value={question.correct_answer}
                    onChange={(e) =>
                        handleInputChangeInArray('quiz', index, 'correct_answer', e.target.value)
                    }
                    />
                    <button type="button" onClick={() => handleRemoveItem('quiz', index)}>Удалить вопрос</button>
                </div>
                ))}

            <button type="button" onClick={() => handleAddItem('quiz')}>Добавить вопрос</button>
            <button type="submit">Сохранить урок</button>
            <button type="button" onClick={() => setShowLessonForm(false)}>Отмена</button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h1>{isLogin ? 'Вход' : 'Регистрация'}</h1>
      <form onSubmit={isLogin ? handleLogin : handleRegister}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">{isLogin ? 'Войти' : 'Зарегистрироваться'}</button>
      </form>
      <p>
        {isLogin ? 'Нет аккаунта?' : 'Есть аккаунт?'}{' '}
        <button onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </p>
      {successMessage && <p>{successMessage}</p>}
      {error && <p>{error}</p>}
    </div>
  );
}

export default Profile;


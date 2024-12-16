import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function LessonEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState({
    title: '',
    description: '',
    language: '',
    difficulty_level: '',
    content: {
      text_fragments: [{ text: '', translation: '' }],
      audio: [{ file: '' }],
      video: [{ file: '' }],
    },
  });

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/lessons/${id}`);
        const data = response.data;

        setLesson({
          ...data,
          content: {
            ...data.content,
            audio: data.content.audio || [{ file: '' }],
            video: data.content.video || [{ file: '' }],
          },
        });
      } catch (err) {
        console.error('Ошибка при загрузке урока для редактирования:', err);
      }
    };
    fetchLesson();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLesson({ ...lesson, [name]: value });
  };

  const handleTextFragmentChange = (index, e) => {
    const { name, value } = e.target;
    const updatedFragments = [...lesson.content.text_fragments];
    updatedFragments[index][name] = value;
    setLesson({ ...lesson, content: { ...lesson.content, text_fragments: updatedFragments } });
  };

  const handleFileChange = (e, type, index) => {
    const file = e.target.files[0];
    if (lesson.content[type] && Array.isArray(lesson.content[type]) && lesson.content[type][index]) {
      const updatedContent = { ...lesson.content };
      updatedContent[type][index].file = file;
      setLesson({ ...lesson, content: updatedContent });
    } else {
      console.error(`Массив ${type} не существует или элемент с индексом ${index} не найден`);
    }
  };

  const handleAddTextFragment = () => {
    setLesson({
      ...lesson,
      content: {
        ...lesson.content,
        text_fragments: [...lesson.content.text_fragments, { text: '', translation: '' }],
      },
    });
  };

  const handleAddFile = (type) => {
    const updatedContent = { ...lesson.content };
    updatedContent[type] = updatedContent[type] || [];
    updatedContent[type].push({ file: '' });
    setLesson({
      ...lesson,
      content: updatedContent,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Вы не авторизованы');
        return;
      }

      const formData = new FormData();
      formData.append('title', lesson.title);
      formData.append('description', lesson.description);
      formData.append('language', lesson.language);
      formData.append('difficulty_level', lesson.difficulty_level);

      lesson.content.text_fragments.forEach((fragment, index) => {
        formData.append(`text_fragments[${index}][text]`, fragment.text);
        formData.append(`text_fragments[${index}][translation]`, fragment.translation);
      });

      const addFiles = (type) => {
        if (lesson.content[type]) {
          lesson.content[type].forEach((item, index) => {
            if (item.file) {
              formData.append(`${type}[${index}]`, item.file);
            }
          });
        }
      };

      addFiles('audio');
      addFiles('video');

      await axios.put(`http://localhost:5000/lessons/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      alert('Урок успешно обновлен!');
      navigate(`/lessons/${id}`);
    } catch (err) {
      console.error('Ошибка при обновлении урока:', err);
      alert('Ошибка при обновлении урока');
    }
  };

  return (
    <div className="lesson-edit">
      <h1>Редактировать урок</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Название</label>
          <input
            type="text"
            name="title"
            value={lesson.title}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Описание</label>
          <textarea
            name="description"
            value={lesson.description}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Язык</label>
          <select
            name="language"
            value={lesson.language}
            onChange={handleInputChange}
          >
            <option value="es">Испанский</option>
            <option value="en">Английский</option>
          </select>
        </div>
        <div>
          <label>Уровень сложности</label>
          <select
            name="difficulty_level"
            value={lesson.difficulty_level}
            onChange={handleInputChange}
          >
            <option value="beginner">Начальный</option>
            <option value="intermediate">Средний</option>
            <option value="advanced">Сложный</option>
          </select>
        </div>

        {/*форма*/}
        <button type="submit">Сохранить изменения</button>
      </form>
    </div>
  );
}

export default LessonEdit;

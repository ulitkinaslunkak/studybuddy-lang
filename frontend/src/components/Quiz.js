import React, { useState } from 'react';
import './Quiz.css'; 
import './LessonDetails.css';

const Quiz = ({ quizData, onQuizSubmit }) => {
  const [quizAnswers, setQuizAnswers] = useState({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  const handleQuizAnswer = (questionIndex, optionIndex) => {
    if (!isQuizSubmitted) {
      setQuizAnswers((prev) => ({
        ...prev,
        [questionIndex]: optionIndex,
      }));
    }
  };

  const handleSubmitQuiz = () => {
    setIsQuizSubmitted(true); 
    if (onQuizSubmit) {
      onQuizSubmit(quizAnswers);
    }
  };

  const isSubmitButtonEnabled = Object.keys(quizAnswers).length === quizData.length;

  return (
    <div className="quiz-container">
      <h2 class="centered-header">Небольшой тест для проверки знаний</h2>
      {quizData && quizData.length > 0 ? (
        quizData.map((item, questionIndex) => (
          <div key={questionIndex} className="quiz-question">
            <strong>{item.question}</strong>
            <ul>
              {item.options.map((option, optionIndex) => {
                const isCorrect = optionIndex === item.correct_answer;
                const isSelected = quizAnswers[questionIndex] === optionIndex;

                let buttonStyle = {};

                if (isQuizSubmitted) {
                  //если тест отправлен, проверка правильности выбора
                  if (isSelected) {
                    buttonStyle = isCorrect
                      ? { backgroundColor: 'green', color: 'white' } 
                      : { backgroundColor: 'red', color: 'white' };  
                  } else if (isCorrect) {
                    buttonStyle = { backgroundColor: 'green', color: 'white' };  
                  } else {
                    buttonStyle = { backgroundColor: 'white', color: 'black' }; 
                  }
                } else {
                  buttonStyle = isSelected
                    ? { backgroundColor: '#ddd', color: 'black' } 
                    : { backgroundColor: '#007bff', color: 'white' }; 
                }

                return (
                  <li key={optionIndex} className="quiz-option">
                    <button
                      onClick={() => handleQuizAnswer(questionIndex, optionIndex)}
                      style={{
                        padding: '10px',
                        margin: '5px',
                        cursor: 'pointer',
                        borderRadius: '5px',
                        ...buttonStyle,
                      }}
                      disabled={isQuizSubmitted} //заблокировать кнопки после отправки
                    >
                      {option}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      ) : (
        <div>Нет данных о тестах</div>
      )}
      {!isQuizSubmitted && (
        <button
          onClick={handleSubmitQuiz}
          className={`submit-quiz-btn ${isSubmitButtonEnabled ? 'enabled' : ''}`}
          disabled={!isSubmitButtonEnabled} //отключить кнопку, если не выбраны все ответы
        >
          Отправить тест
        </button>
      )}
    </div>
  );
};

export default Quiz;

import { useState, useEffect } from 'react';
import axios from 'axios';
import './LessonReviews.css'; 

function LessonReviews({ lessonId, onReviewSubmit }) {
    const [reviews, setReviews] = useState([]);
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/lesson/${lessonId}/reviews`);
                setReviews(response.data);
            } catch (err) {
                console.error('Ошибка при загрузке отзывов:', err.response?.data || err.message);
            }
        };

        fetchReviews();
    }, [lessonId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Для добавления отзыва необходимо войти в систему');
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/lesson/${lessonId}/review`,
                { text },
                { headers: { Authorization: token } }
            );
            setSuccessMessage('Ваш отзыв успешно добавлен!');
            setText('');
            const responseReviews = await axios.get(`http://localhost:5000/lesson/${lessonId}/reviews`);
            setReviews(responseReviews.data);

            if (onReviewSubmit) {
                onReviewSubmit();
            }
        } catch (err) {
            setError('Ошибка при добавлении отзыва');
        }
    };

    const handleDelete = async (reviewId, reviewUserId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Для удаления отзыва необходимо войти в систему');
            return;
        }

        const decoded = JSON.parse(atob(token.split('.')[1]));
        const currentUserId = decoded.userId;

        if (currentUserId !== reviewUserId) {
            setError('Вы не можете удалить чужой отзыв');
            return;
        }

        try {
            await axios.delete(`http://localhost:5000/lesson/${lessonId}/review/${reviewId}`, {
                headers: {
                    Authorization: token,
                },
            });
            setSuccessMessage('Отзыв успешно удален');
            const responseReviews = await axios.get(`http://localhost:5000/lesson/${lessonId}/reviews`);
            setReviews(responseReviews.data);
        } catch (err) {
            setError('Ошибка при удалении отзыва');
        }
    };

    return (
        <div>
            <h3>Отзывы</h3>
            <form onSubmit={handleSubmit}>
                <textarea
                    placeholder="Ваш отзыв"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                />
                <button type="submit">Оставить отзыв</button>
            </form>
            {successMessage && <p className="success-message">{successMessage}</p>}
            {error && <p className="error-message">{error}</p>}

            <div>
                {reviews.length > 0 ? (
                    reviews.map((review) => (
                        <div key={review._id} className="review-container">
                            <strong className="review-header">
                                {review.userId ? review.userId._id : 'Неизвестный пользователь'}
                            </strong>
                            <p className="review-text">{review.text}</p>
                            <small className="review-date">
                                Отзыв оставлен: {new Date(review.createdAt).toLocaleString()}
                            </small>
                            <button onClick={() => handleDelete(review._id, review.userId._id)}>Удалить отзыв</button>
                        </div>
                    ))
                ) : (
                    <p className="no-reviews">Нет отзывов для этого урока</p>
                )}
            </div>
        </div>
    );
}

export default LessonReviews;

const express = require('express'); //фреймворк для создания веб-приложений на Node.js
const mongoose = require('mongoose');
const cors = require('cors'); //политики доступа к ресурсам между разными доменами
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer'); 
const fs = require('fs'); 

const app = express();
app.use('/uploads', express.static('uploads'));

mongoose.connect('mongodb://localhost:27017/studybuddy', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Подключено к базе данных MongoDB');
  })
  .catch((err) => {
    console.error('Ошибка подключения к базе данных', err);
  });

app.use(cors());
app.use(bodyParser.json());

const lessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    language: { type: String, required: true },
    difficulty_level: { type: String, required: true },
    content: {
      text_fragments: [
        { text: { type: String, required: true }, translation: { type: String, required: true } }
      ],
      audio: [{ file: { type: String, required: true }, description: { type: String, required: true } }],
      video: [{ file: { type: String, required: true }, description: { type: String, required: true } }],
      pictures: [{ file: { type: String, required: true }, description: { type: String, required: true } }]
    },
    vocabulary: [{ word: String, translation: String }],
    quiz: [{ question: String, options: [{ type: String }], correct_answer: Number }],
    likes: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    reviews: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          text: { type: String, required: true }
        }
      ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Новый ключ
}, { timestamps: true });

lessonSchema.pre('save', async function (next) {
    if (!this.isNew) return next();
  
    const lastLesson = await mongoose.model('Lesson').findOne({}, { id: 1 }).sort({ id: -1 });
    this.id = lastLesson ? lastLesson.id + 1 : 1;
    next();
  });

const Lesson = mongoose.model('Lesson', lessonSchema);

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    points: { type: Number, default: 0 } 
  });
  
  const User = mongoose.model('User', userSchema);

app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, 'secret_key', { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error('Ошибка при регистрации:', err);
        res.status(500).json({ message: 'Ошибка при регистрации' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Пользователь не найден' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверный пароль' });
        }

        const token = jwt.sign({ userId: user._id }, 'secret_key', { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка при входе' });
    }
});

app.get('/profile', (req, res) => {
    const token = req.headers['authorization']; // Получаем токен из заголовка

    if (!token) {
        return res.status(401).json({ message: 'Необходима авторизация' });
    }

    try {
        const decoded = jwt.verify(token, 'secret_key');
        const userId = decoded.userId;

        User.findById(userId)
            .then((user) => {
                if (!user) {
                    return res.status(404).json({ message: 'Пользователь не найден' });
                }
                res.json(user);
            })
            .catch((err) => {
                res.status(500).json({ message: 'Ошибка при загрузке данных пользователя' });
            });
    } catch (err) {
        res.status(401).json({ message: 'Неверный или истекший токен' });
    }
});

app.get('/lessons', async (req, res) => {
  try {
    const lessons = await Lesson.find();
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении уроков', details: err });
  }
});

app.get('/lessons/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Запрос на урок с ID:', id); 
    
    try {
      const lesson = await Lesson.findById(id); 
      if (!lesson) {
        return res.status(404).json({ message: 'Урок не найден' });
      }
      res.json(lesson);
    } catch (err) {
      console.error('Ошибка при загрузке урока:', err);
      res.status(500).json({ message: 'Ошибка при загрузке урока' });
    }
  });

  app.put('/lessons/:id', async (req, res) => {
    const lessonId = req.params.id;
    const { title, description, language, difficulty_level, content, vocabulary, quiz } = req.body;
    const token = req.headers['authorization'];
  
    if (!token) {
      return res.status(401).json({ message: 'Необходима авторизация' });
    }
  
    try {
      const jwtToken = token.split(' ')[1];
      const decoded = jwt.verify(jwtToken, 'secret_key');
      const userIdFromToken = decoded.userId;
  
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: 'Урок не найден' });
      }
  
      if (lesson.createdBy.toString() !== userIdFromToken) {
        return res.status(403).json({ message: 'Вы не можете редактировать чужой урок' });
      }
  
      lesson.title = title;
      lesson.description = description;
      lesson.language = language;
      lesson.difficulty_level = difficulty_level;
      lesson.content = content;
      lesson.vocabulary = vocabulary;
      lesson.quiz = quiz;
  
      await lesson.save(); 
  
      res.json(lesson); 
    } catch (err) {
      console.error('Ошибка при обновлении урока:', err);
      res.status(500).json({ message: 'Ошибка при обновлении урока' });
    }
  });

  app.post('/users/add-points', async (req, res) => {
    const tokenHeader = req.headers['authorization'];
  
    if (!tokenHeader) {
      return res.status(401).json({ message: 'Необходима авторизация' });
    }
  
    try {
      const token = tokenHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Токен отсутствует или неверный формат' });
      }
  
      const decoded = jwt.verify(token, 'secret_key');
      const userId = decoded.userId;
  
      const { points } = req.body;
      if (!points || points <= 0) {
        return res.status(400).json({ message: 'Некорректное значение баллов' });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }
  
      user.points = (user.points || 0) + points;
      await user.save();
  
      res.json({ message: 'Баллы успешно добавлены', points: user.points });
    } catch (err) {
      console.error('Ошибка при обработке токена или начислении баллов:', err);
  
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ message: 'Недействительный токен' });
      }
  
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  });
  
  app.delete('/lessons/:lessonId', async (req, res) => {
    const token = req.headers['authorization'];
  
    if (!token) {
      return res.status(401).json({ message: 'Необходима авторизация' });
    }
  
    try {
      const jwtToken = token.split(' ')[1];
      if (!jwtToken) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
      }
  
      const decoded = jwt.verify(jwtToken, 'secret_key');
      const userIdFromToken = decoded.userId;
  
      const lesson = await Lesson.findById(req.params.lessonId);
      if (!lesson) {
        return res.status(404).json({ message: 'Урок не найден' });
      }
  
      if (lesson.createdBy.toString() !== userIdFromToken) {
        return res.status(403).json({ message: 'Вы не можете удалить чужой урок' });
      }
  
      await Lesson.findByIdAndDelete(req.params.lessonId);
  
      res.status(200).json({ message: 'Урок успешно удален' });
    } catch (err) {
      console.error('Ошибка при удалении урока:', err);
      res.status(500).json({ message: 'Ошибка при удалении урока' });
    }
  });
  
//хранилище для multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.fieldname; //поле (audio, video, pictures)
    const uploadPath = path.join(__dirname, 'uploads', type);
    fs.mkdirSync(uploadPath, { recursive: true }); //создание папки, если ее нет
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname); 
    const id = req.body.id || Date.now();
    cb(null, `${id}-${Date.now()}${extension}`);
  },
});

const upload = multer({ storage });

app.post('/lessons', upload.fields([
  { name: 'audio', maxCount: 10 },
  { name: 'video', maxCount: 10 },
  { name: 'pictures', maxCount: 10 },
]), async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Необходима авторизация' });
  }

  try {
    const decoded = jwt.verify(token, 'secret_key');
    const userId = decoded.userId;

    const { title, description, language, difficulty_level, content, vocabulary, quiz } = req.body;

    const audioPaths = (req.files.audio || []).map(file => `uploads/audio/${file.filename}`);
    const videoPaths = (req.files.video || []).map(file => `uploads/video/${file.filename}`);
    const picturePaths = (req.files.pictures || []).map(file => `uploads/pictures/${file.filename}`);

    const audioDescriptions = req.body.audioDescriptions ? JSON.parse(req.body.audioDescriptions) : [];
    const videoDescriptions = req.body.videoDescriptions ? JSON.parse(req.body.videoDescriptions) : [];
    const pictureDescriptions = req.body.pictureDescriptions ? JSON.parse(req.body.pictureDescriptions) : [];

    const newLesson = new Lesson({
      title,
      description,
      language,
      difficulty_level,
      content: {
        ...JSON.parse(content),
        audio: audioPaths.map((path, index) => ({
          file: path,
          description: audioDescriptions[index] || ''
        })),
        video: videoPaths.map((path, index) => ({
          file: path,
          description: videoDescriptions[index] || ''
        })),
        pictures: picturePaths.map((path, index) => ({
          file: path,
          description: pictureDescriptions[index] || ''
        })),
      },
      vocabulary: JSON.parse(vocabulary),
      quiz: JSON.parse(quiz),
      createdBy: userId 
    });

    await newLesson.save();
    res.status(201).json({ message: 'Урок успешно создан', lesson: newLesson });
  } catch (error) {
    console.error('Ошибка при создании урока:', error);
    res.status(500).json({ message: 'Ошибка при создании урока' });
  }
});

app.post('/lessons/:id/like', async (req, res) => {
    const lessonId = req.params.id;
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Токен не передан' });
      }

    try {
        const decoded = jwt.verify(token, 'secret_key');
        const userId = decoded.userId;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Урок не найден' });
        }

        if (lesson.likes.includes(userId)) {
            return res.status(400).json({ message: 'Вы уже поставили лайк этому уроку' });
        }

        lesson.likes.push(userId);
        await lesson.save();

        const updatedLesson = await Lesson.findById(lessonId);
        const userLiked = updatedLesson.likes.includes(userId);  //проверка, лайкнул ли пользователь
        res.json({ message: 'Лайк успешно добавлен', likesCount: updatedLesson.likes.length, userLiked });
    } catch (err) {
        console.error('Ошибка при постановке лайка:', err);
        res.status(500).json({ message: 'Ошибка при постановке лайка' });
    }
});

app.get('/lessons/:id/likes', async (req, res) => {
    const lessonId = req.params.id;

    try {
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Урок не найден' });
        }

        res.json({ likesCount: lesson.likes.length });
    } catch (err) {
        console.error('Ошибка при получении лайков:', err);
        res.status(500).json({ message: 'Ошибка при получении лайков' });
    }
});

app.post('/lesson/:id/review', async (req, res) => {
    const { text } = req.body;
    const { id } = req.params;

    const token = req.headers['authorization']; 
    if (!token) {
        return res.status(401).json({ message: 'Необходима авторизация' });
    }

    try {
        const decoded = jwt.verify(token, 'secret_key');
        const userId = decoded.userId;  

        const lesson = await Lesson.findById(id);
        if (!lesson) {
            return res.status(404).json({ message: 'Урок не найден' });
        }

        lesson.reviews.push({ userId, text });
        await lesson.save();
        
        res.status(200).json({ message: 'Отзыв добавлен' });
    } catch (err) {
        console.error('Ошибка при добавлении отзыва:', err);
        res.status(500).json({ message: 'Ошибка при добавлении отзыва' });
    }
});


app.get('/lesson/:lessonId/reviews', async (req, res) => {
    const lessonId = req.params.lessonId;
    try {
        const lesson = await Lesson.findById(lessonId).populate('reviews.userId'); 

        if (!lesson) {
            return res.status(404).send('Урок не найден');
        }

        res.json(lesson.reviews);
    } catch (err) {
        console.error('Ошибка при загрузке отзывов:', err);
        res.status(500).send('Ошибка при загрузке отзывов');
    }
});

app.delete('/lesson/:lessonId/review/:reviewId', async (req, res) => {
    const { lessonId, reviewId } = req.params;
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Необходима авторизация' });
    }

    try {
        const decoded = jwt.verify(token, 'secret_key');
        const userIdFromToken = decoded.userId; 
        console.log("Decoded userId:", userIdFromToken);

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Урок не найден' });
        }

        const review = lesson.reviews.id(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Отзыв не найден' });
        }

        console.log("Review User ID:", review.userId); 

        if (review.userId._id.toString() !== userIdFromToken) {
            return res.status(403).json({ message: 'Вы не можете удалить чужой отзыв' });
        }

        lesson.reviews.pull(reviewId);
        await lesson.save();

        res.status(200).json({ message: 'Отзыв удален' });
    } catch (err) {
        console.error('Ошибка при удалении отзыва:', err);
        res.status(500).json({ message: 'Ошибка при удалении отзыва' });
    }
});

app.get('/users/me', async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
      return res.status(401).json({ message: 'Необходима авторизация' });
  }

  try {
      const decoded = jwt.verify(token, 'secret_key');
      const userIdFromToken = decoded.userId; 
      console.log("Decoded userId:", userIdFromToken);

      const user = await User.findById(userIdFromToken).select('-password'); 
      if (!user) {
          return res.status(404).json({ message: 'Пользователь не найден' });
      }

      res.status(200).json(user);
  } catch (err) {
      console.error('Ошибка при получении данных пользователя:', err);
      res.status(500).json({ message: 'Ошибка при получении данных пользователя' });
  }
});

app.get('/main', (req, res) => {
    res.json({ 
      message: 'Добро пожаловать на StudyBuddy Lang! Здесь вы можете комфортно обучаться интересующему вас языку.' 
    });
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});


const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lessonSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  language: { type: String },
  difficulty_level: { type: String },
  content: {
    text_fragments: [
      { text: String, translation: String }
    ],
    audio: [
      { file: String, description: String }
    ],
    video: [
      { file: String, description: String }
    ],
    pictures: [
      { file: String, description: String }
    ]
  },
  vocabulary: [
    { word: String, translation: String }
  ],
  quiz: [
    {
      question: String,
      options: [String],
      correct_answer: Number
    }
  ]
});

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;

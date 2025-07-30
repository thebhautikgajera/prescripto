import mongoose from "mongoose";

const symptomHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['english', 'gujarati', 'hindi'],
    default: 'english'
  },
  analysis: {
    type: String,
    required: true
  },

  suggestedDoctors: [
    {
      doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor'
      },
      name: String,
      speciality: String,
      image: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const symptomHistoryModel = mongoose.models.symptomHistory || mongoose.model("symptomHistory", symptomHistorySchema);
export default symptomHistoryModel;
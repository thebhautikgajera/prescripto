import axios from 'axios';
import doctorModel from '../models/doctorModel.js';
import symptomHistoryModel from '../models/symptomHistoryModel.js';

// Get user's symptom check history
export const getSymptomHistory = async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const history = await symptomHistoryModel.find({ userId: req.user.id })
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching symptom history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching symptom history',
      error: error.message
    });
  }
};



// AI Symptom Checker
export const analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms, language = 'english' } = req.body;

    // Validate input
    if (!symptoms) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms are required'
      });
    }

    // Validate user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Check if OpenRouter API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OpenRouter API key is not configured'
      });
    }

    // Prepare the prompt for the AI model based on language preference
    let prompt;

    switch (language.toLowerCase()) {
      case 'gujarati':
        prompt = `You are a medical assistant helping to analyze patient symptoms. Based on the following symptoms, suggest possible conditions and what type of specialist the patient should see. Be clear, concise, and informative without being alarmist. Do not provide a definitive diagnosis, only suggestions. Respond ONLY in Gujarati language. Here are the symptoms: ${symptoms}`;
        break;
      case 'hindi':
        prompt = `You are a medical assistant helping to analyze patient symptoms. Based on the following symptoms, suggest possible conditions and what type of specialist the patient should see. Be clear, concise, and informative without being alarmist. Do not provide a definitive diagnosis, only suggestions. Respond ONLY in Hindi language. Here are the symptoms: ${symptoms}`;
        break;
      default: // english
        prompt = `You are a medical assistant helping to analyze patient symptoms. Based on the following symptoms, suggest possible conditions and what type of specialist the patient should see. Be clear, concise, and informative without being alarmist. Do not provide a definitive diagnosis, only suggestions. Here are the symptoms: ${symptoms}`;
    }

    // Call OpenRouter API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'z-ai/glm-4.5-air:free', // Using default model
        messages: [
          { role: 'system', content: 'You are a helpful medical assistant that analyzes symptoms and suggests possible conditions and specialist types. You are not a doctor and cannot provide definitive diagnoses.' },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the AI's response
    const aiResponse = response.data.choices[0].message.content;

    // Find relevant doctors based on the AI response
    // Extract potential specialties from the AI response based on language
    let specialtyKeywords = [];

    // English specialty keywords (used for all languages)
    const englishSpecialtyKeywords = [
      'General Physician', 'Family Doctor', 'Internal Medicine', 'Primary Care Doctor', 'General Doctor', 'GP',
      'Cardiologist', 'Heart Specialist', 'Heart Doctor', 'Cardiac Specialist', 'Heart Surgeon',
      'Neurologist', 'Brain Specialist', 'Nerve Specialist', 'Neuro Doctor', 'Nervous System Doctor',
      'Gastroenterologist', 'Digestive Specialist', 'Stomach Doctor', 'Gut Specialist', 'GI Specialist', 'Digestive System Doctor',
      'Dermatologist', 'Skin Specialist', 'Skin Doctor', 'Skin Care Specialist', 'Derm Doctor',
      'Orthopedic', 'Bone Specialist', 'Bone Doctor', 'Joint Specialist', 'Orthopaedic Surgeon', 'Orthopaedist',
      'ENT', 'Ear, Nose, Throat', 'ENT Specialist', 'ENT Doctor', 'Ear Doctor', 'Throat Specialist', 'Nose Doctor',
      'Ophthalmologist', 'Eye Specialist', 'Eye Doctor', 'Vision Specialist', 'Ophthalmic Surgeon', 'Optometrist', 'Eye Surgeon',
      'Gynecologist', 'Women\'s Health', 'Female Health Specialist', 'Women\'s Doctor', 'Obstetrician', 'OB-GYN', 'Pregnancy Doctor',
      'Urologist', 'Urinary Specialist', 'Urology Doctor', 'Kidney Doctor', 'Bladder Specialist', 'Urine Doctor',
      'Psychiatrist', 'Mental Health', 'Mental Health Specialist', 'Psych Doctor', 'Psychological Specialist', 'Mind Doctor',
      'Endocrinologist', 'Hormone Specialist', 'Thyroid Doctor', 'Gland Specialist', 'Diabetes Doctor', 'Metabolism Specialist',
      'Pulmonologist', 'Lung Specialist', 'Chest Doctor', 'Respiratory Specialist', 'Breathing Specialist', 'Pulmonary Doctor',
      'Rheumatologist', 'Arthritis Specialist', 'Joint Pain Doctor', 'Autoimmune Specialist', 'Rheumatic Disease Doctor',
      'Oncologist', 'Cancer Specialist', 'Cancer Doctor', 'Tumor Specialist', 'Cancer Treatment Doctor',
      'Pediatrician', 'Children\'s Doctor', 'Child Specialist', 'Kids Doctor', 'Pediatrics Specialist'
    ];


    // Hindi specialty keywords
    const hindiSpecialtyKeywords = [
      'General Physician', 'सामान्य चिकित्सक', 'परिवार डॉक्टर', 'फैमिली डॉक्टर', 'आंतरिक चिकित्सा', 'जनरल फिजिशियन',
      'Cardiologist', 'हृदय रोग विशेषज्ञ', 'हृदय विशेषज्ञ', 'कार्डियोलॉजिस्ट', 'दिल के डॉक्टर', 'दिल विशेषज्ञ',
      'Neurologist', 'न्यूरोलॉजिस्ट', 'मस्तिष्क विशेषज्ञ', 'तंत्रिका विशेषज्ञ', 'दिमाग के डॉक्टर', 'नर्व स्पेशलिस्ट',
      'Gastroenterologist', 'गैस्ट्रोएंटेरोलॉजिस्ट', 'पाचन विशेषज्ञ', 'आंतों के डॉक्टर', 'गैस का डॉक्टर', 'डाइजेशन स्पेशलिस्ट',
      'Dermatologist', 'त्वचा विशेषज्ञ', 'डर्मेटोलॉजिस्ट', 'स्किन डॉक्टर', 'चर्म रोग विशेषज्ञ', 'चर्म रोगी',
      'Orthopedic', 'हड्डी विशेषज्ञ', 'ऑर्थोपेडिक', 'हड्डियों के डॉक्टर', 'हड्डी रोग विशेषज्ञ', 'आर्थोपेडिक',
      'ENT', 'ईएनटी', 'कान, नाक, गला', 'नाक-कान-गला विशेषज्ञ', 'ईएनटी डॉक्टर', 'कान नाक गला',
      'Ophthalmologist', 'नेत्र विशेषज्ञ', 'आंख विशेषज्ञ', 'नेत्र रोग विशेषज्ञ', 'आई स्पेशलिस्ट', 'आई डॉक्टर',
      'Gynecologist', 'स्त्री रोग विशेषज्ञ', 'महिला स्वास्थ्य', 'गाइनकॉलजिस्ट', 'गर्भाशय डॉक्टर', 'महिला डॉक्टर', 'गर्भवती महिला डॉक्टर',
      'Urologist', 'मूत्र रोग विशेषज्ञ', 'यूरोलॉजिस्ट', 'पेशाब संबंधी डॉक्टर', 'मूत्र विशेषज्ञ', 'यूरीन डॉक्टर',
      'Psychiatrist', 'मनोचिकित्सक', 'मानसिक स्वास्थ्य', 'पागलपन का डॉक्टर', 'साइकेट्रिस्ट', 'मेंटल हेल्थ स्पेशलिस्ट',
      'Endocrinologist', 'एंडोक्रिनोलॉजिस्ट', 'हार्मोन विशेषज्ञ', 'थायरॉइड डॉक्टर', 'ग्लैंड स्पेशलिस्ट',
      'Pulmonologist', 'फेफड़े विशेषज्ञ', 'पल्मोनोलॉजिस्ट', 'सांस के डॉक्टर', 'फेफड़ा रोग विशेषज्ञ', 'रेस्पिरेटरी स्पेशलिस्ट',
      'Rheumatologist', 'गठिया विशेषज्ञ', 'रुमेटोलॉजिस्ट', 'जोड़ों का डॉक्टर', 'आर्थराइटिस स्पेशलिस्ट',
      'Oncologist', 'कैंसर विशेषज्ञ', 'ऑन्कोलॉजिस्ट', 'कैंसर का डॉक्टर', 'ट्यूमर स्पेशलिस्ट',
      'Pediatrician', 'बालरोग विशेषज्ञ', 'बच्चों के डॉक्टर', 'बाल रोगी', 'पीडियाट्रिशियन', 'बच्चों का डॉक्टर'
    ];


    // Gujarati specialty keywords
    const gujaratiSpecialtyKeywords = [
      'General Physician', 'સામાન્ય ચિકિત્સક', 'ફેમિલી ડૉક્ટર', 'ફેમીલી ડોક્ટર', 'આંતરિક ચિકિત્સા', 'જનરલ ફિઝિશિયન',
      'Cardiologist', 'હૃદય રોગ નિષ્ણાત', 'હૃદય નિષ્ણાત', 'કાર્ડિયોલોજિસ્ટ', 'દિલના ડૉક્ટર', 'દિલ નિષ્ણાત',
      'Neurologist', 'ન્યુરોલોજિસ્ટ', 'મગજ નિષ્ણાત', 'નસ નિષ્ણાત', 'તંત્રિકા નિષ્ણાત', 'દિમાગના ડોક્ટર',
      'Gastroenterologist', 'ગેસ્ટ્રોએન્ટેરોલોજિસ્ટ', 'પાચન નિષ્ણાત', 'આંતોના ડોક્ટર', 'ગેસના નિષ્ણાત',
      'Dermatologist', 'ત્વચા નિષ્ણાત', 'ડર્મેટોલોજિસ્ટ', 'ચામડીના ડૉક્ટર', 'ચર્મરોગ નિષ્ણાત',
      'Orthopedic', 'હાડકાં નિષ્ણાત', 'ઓર્થોપેડિક', 'હાડકાંના ડોક્ટર', 'આસ્થિ નિષ્ણાત',
      'ENT', 'ઈએનટી', 'કાન, નાક, ગળું', 'ઈએનટી ડોક્ટર', 'કાન નાક ગળા નિષ્ણાત',
      'Ophthalmologist', 'નેત્ર નિષ્ણાત', 'આંખ નિષ્ણાત', 'આંખોના ડોક્ટર', 'આંખ રોગ નિષ્ણાત',
      'Gynecologist', 'સ્ત્રી રોગ નિષ્ણાત', 'મહિલા સ્વાસ્થ્ય', 'ગાયનેકોલોજિસ્ટ', 'ગર્ભાશયના ડોક્ટર', 'સ્ત્રીઓના ડોક્ટર',
      'Urologist', 'મૂત્ર રોગ નિષ્ણાત', 'યુરોલોજિસ્ટ', 'યુરિનના નિષ્ણાત', 'મૂત્ર નળીના નિષ્ણાત',
      'Psychiatrist', 'મનોચિકિત્સક', 'માનસિક સ્વાસ્થ્ય', 'સાયકિયાટ્રિસ્ટ', 'મગજના રોગના નિષ્ણાત',
      'Endocrinologist', 'એન્ડોક્રિનોલોજિસ્ટ', 'હોર્મોન નિષ્ણાત', 'થાયરોઇડ નિષ્ણાત', 'ગ્રંથિ નિષ્ણાત',
      'Pulmonologist', 'ફેફસાં નિષ્ણાત', 'પલ્મોનોલોજિસ્ટ', 'શ્વાસ નળીના નિષ્ણાત', 'સાંસના નિષ્ણાત',
      'Rheumatologist', 'સાંધા નિષ્ણાત', 'રુમેટોલોજિસ્ટ', 'ગઠિયાના નિષ્ણાત', 'જોડા દર્દના ડોક્ટર',
      'Oncologist', 'કેન્સર નિષ્ણાત', 'ઓન્કોલોજિસ્ટ', 'ટ્યુમર નિષ્ણાત', 'કેન્સરના ડોક્ટર',
      'Pediatrician', 'બાળરોગ નિષ્ણાત', 'બાળકોના ડૉક્ટર', 'પીડિયાટ્રિશિયન', 'પીડિયાટ્રિશન', 'બાળ શસ્ત્ર નિષ્ણાત' , 'બાળરોગ વિશેષજ્ઞ'
    ];


    // Set the specialty keywords based on the selected language
    // Since we've included English terms in all language arrays, we don't need to add them separately
    specialtyKeywords = [...englishSpecialtyKeywords]; // Always include English keywords

    // Add language-specific keywords based on the selected language
    if (language.toLowerCase() === 'hindi') {
      specialtyKeywords = [...hindiSpecialtyKeywords]; // Hindi keywords already include English terms
    } else if (language.toLowerCase() === 'gujarati') {
      specialtyKeywords = [...gujaratiSpecialtyKeywords]; // Gujarati keywords already include English terms
    }

    // Find which specialties are mentioned in the AI response
    const mentionedSpecialties = specialtyKeywords.filter(specialty =>
      aiResponse.toLowerCase().includes(specialty.toLowerCase())
    );

    // Find doctors with matching specialties
    let suggestedDoctors = [];
    if (mentionedSpecialties.length > 0) {
      // Create a regex pattern to match any of the mentioned specialties
      const specialtyPattern = new RegExp(mentionedSpecialties.join('|'), 'i');

      suggestedDoctors = await doctorModel.find(
        {
          speciality: { $regex: specialtyPattern },
          available: true
        },
        {
          _id: 1,
          name: 1,
          speciality: 1,
          image: 1,
          experience: 1,
          fees: 1,
          averageRating: 1,
          reviewsCount: 1
        }
      ).limit(3);
    }

    // Save the symptom check to history
    const symptomHistory = new symptomHistoryModel({
      userId: req.user.id, // Changed from req.user._id to req.user.id to match JWT payload
      symptoms,
      language,
      analysis: aiResponse,
      suggestedDoctors: suggestedDoctors.map(doctor => ({
        doctorId: doctor._id,
        name: doctor.name,
        speciality: doctor.speciality,
        image: doctor.image
      }))
    });

    await symptomHistory.save();

    res.status(200).json({
      success: true,
      analysis: aiResponse,
      suggestedDoctors
    });
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing symptoms',
      error: error.message
    });
  }
};